import os, json, io, re, traceback, logging
import boto3, openpyxl
from urllib.parse import unquote_plus
from datetime import datetime, timezone

# ───────────────────────────── Logging ──────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─────────────────────── AWS clients/resources ──────────────────────
s3   = boto3.client('s3')
ddb  = boto3.resource('dynamodb').Table('LogisticsData')
sns  = boto3.client('sns')
ses  = boto3.client('ses')

SNS_TOPIC  = os.environ['SNS_TOPIC_ARN']
SES_SENDER = os.environ['SES_SENDER'].strip()

_email_re = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

# Helper function to send SES emails
def send_ses_notification(email, subject, message):
    if not _email_re.match(email):
        logger.warning("Skip SES: invalid e-mail %s", email)
        return False
        
    try:
        ses.send_email(
            Source=SES_SENDER,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": message}},
            },
        )
        logger.info("SES mail sent → %s", email)
        return True
    except Exception:
        logger.error("SES error:\n%s", traceback.format_exc())
        return False

# ───────────────────────────── Handler ──────────────────────────────
def handler(event, context):
    logger.info("Invocation started: %s records", len(event.get("Records", [])))

    for record in event["Records"]:
        try:
            # ── 1. Parse S3 info from the SQS body ──────────────────
            body   = json.loads(record["body"])
            detail = body.get("detail", body)
            bucket = detail["bucket"]["name"]
            key    = unquote_plus(detail["object"]["key"])
            logger.info("Processing %s/%s", bucket, key)

            # Extract uploader email early for error notifications
            parts = key.split("/")
            if parts[0] == "private":
                company_id     = parts[1]
                uploader_email = parts[2]
                filename       = "/".join(parts[3:])
            else:
                company_id     = parts[0]
                uploader_email = parts[1]
                filename       = "/".join(parts[2:])
            
            uploader_email = unquote_plus(uploader_email)
            upload_id      = filename.rsplit(".", 1)[0]
            
            logger.info("Uploader email: %s | CompanyID: %s", uploader_email, company_id)

            try:
                # ── 2. Download and open Excel file ────────────────────
                obj   = s3.get_object(Bucket=bucket, Key=key)
                wb    = openpyxl.load_workbook(io.BytesIO(obj["Body"].read()))
                sheet = wb.active
            except Exception as excel_error:
                # Handle Excel parsing errors specifically
                error_message = str(excel_error)
                logger.error("Excel parsing error: %s\n%s", error_message, traceback.format_exc())
                
                # Notify management via SNS about the failure
                sns.publish(
                    TopicArn=SNS_TOPIC,
                    Subject="Upload Processing Failed",
                    Message=f"File {key} processing failed for {company_id}. Error: {error_message}",
                )
                
                # Send failure notification to the uploader
                send_ses_notification(
                    uploader_email,
                    "Your file could not be processed",
                    f"We encountered an issue processing your file {filename}. The file format may be incorrect or the file may be corrupted. Please check your file and try uploading again."
                )
                
                # Skip to the next record
                continue

            # ── 3. Write each row to DynamoDB ─────────
            headers = [
                str(cell.value).strip() if cell.value is not None else ""
                for cell in sheet[1]
            ]
            rows_written = 0

            for idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=1):
                row_data = dict(zip(headers, row))
                ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
                shipment_id = f"{ts}-{upload_id}-{idx}"

                try:
                    ddb.put_item(
                        Item={
                            "CompanyID":    company_id,
                            "ShipmentID":   shipment_id,
                            "OrderID":      str(row_data.get("OrderID", "")),
                            "Origin":       row_data.get("Origin", ""),
                            "Destination":  row_data.get("Destination", ""),
                            "Weight_kg":    str(row_data.get("Weight_kg", "")),
                            "DispatchDate": str(row_data.get("DispatchDate", "")),
                            "ExpectedDeliveryDate": str(row_data.get("ExpectedDeliveryDate", "")),
                            "ActualDeliveryDate": str(row_data.get("ActualDeliveryDate", "")),
                            "SourceFile":   key
                        },
                        ConditionExpression="attribute_not_exists(ShipmentID)",
                    )
                    rows_written += 1
                except ddb.meta.client.exceptions.ConditionalCheckFailedException:
                    logger.warning("Row %s already exists, skipped", idx)
                except Exception:
                    logger.error("DynamoDB error:\n%s", traceback.format_exc())

            logger.info("%s rows written for %s", rows_written, key)

            # ── 4. SNS management notification ─────────────────────
            sns.publish(
                TopicArn=SNS_TOPIC,
                Subject="New Upload Processed",
                Message=f"File {key} processed for {company_id}. Rows: {rows_written}",
            )
            logger.info("SNS notification sent")

            # ── 5. SES receipt email ───
            send_ses_notification(
                uploader_email,
                "Your file was processed",
                f"We processed {filename}. Records imported: {rows_written}"
            )

        except Exception:
            logger.error("Unhandled error:\n%s", traceback.format_exc())

    logger.info("Invocation finished")
    return {"status": "ok"}
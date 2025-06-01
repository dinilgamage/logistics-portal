import json
import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        # Get claims from the authorizer
        claims = event['requestContext']['authorizer']['claims']
        
        # Check if user is in Admin group
        cognito_groups = claims.get('cognito:groups', '')
        
        if 'Admin' not in cognito_groups:
            print(f"Access denied: User not in Admin group")
            return add_cors_headers({
                'statusCode': 403,
                'body': json.dumps({'message': 'Access denied: Admin privileges required'})
            })
        
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(os.environ.get('TABLE_NAME', 'LogisticsData'))
        
        # Get query parameters (optional)
        query_params = event.get('queryStringParameters', {}) or {}
        company_filter = query_params.get('companyId')
        
        if company_filter:
            # If filtering for a specific company
            print(f"Querying for company: {company_filter}")
            response = table.query(
                KeyConditionExpression=Key('CompanyID').eq(company_filter)
            )
        else:
            # Get all companies' data
            print("Scanning all data")
            response = table.scan()
        
        items = response.get('Items', [])
        print(f"Found {len(items)} items")
        
        return add_cors_headers({
            'statusCode': 200,
            'body': json.dumps({
                'shipments': items
            })
        })
        
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return add_cors_headers({
            'statusCode': 500,
            'body': json.dumps({'message': f'Server error: {str(e)}'})
        })

def add_cors_headers(response):
    response['headers'] = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
    return response
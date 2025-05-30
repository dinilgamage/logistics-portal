import React, { useState, useEffect } from "react";
import { Auth, Storage } from "aws-amplify";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { useAuth } from "./auth/AuthProvider";
import SignIn from "./auth/SignIn";
import SignUp from "./auth/SignUp";
import Confirm from "./auth/Confirm";

// Import components
import Navbar from "./components/Navbar";
import UploadTab from "./components/UploadTab";
import ShipmentsTab from "./components/ShipmentsTab";
import AnalyticsTab from "./components/AnalyticsTab"; // Import the new component
import Footer from "./components/Footer";
import LoadingScreen from "./components/LoadingScreen";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const { user, step, setStep } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'shipments' or 'analytics'
  const [isAdmin, setIsAdmin] = useState(false);

  // Reset states when user changes or logs in
  useEffect(() => {
    if (step === "authenticated") {
      resetStates();
    }
  }, [step, user?.username]);

  // Check admin status when user is authenticated
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const session = await Auth.currentSession();
          const groups = session.getIdToken().payload["cognito:groups"] || [];
          setIsAdmin(groups.includes("Admin"));
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [user]);

  // Function to reset all states
  const resetStates = () => {
    setFile(null);
    setStatus("");
    setShipments([]);
    setLoading(false);
    setActiveTab("upload");
  };

  if (step === "loading") return <LoadingScreen />;
  if (step === "signin") return <SignIn />;
  if (step === "signup") return <SignUp />;
  if (step === "confirm") return <Confirm />;

  // ─────────── Authenticated portal ───────────
  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading…");

    const email = user.attributes.email.replace(/[^\w.@-]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "");
    const key = `${email}/${timestamp}-${file.name}`;

    try {
      await Storage.put(key, file, {
        level: "private",
        contentType: file.type,
        progressCallback: (p) =>
          setStatus(`Uploading… ${Math.round((p.loaded / p.total) * 100)}%`),
      });
      setStatus("✅ Uploaded!");
      setFile(null);

      // Show success message with animation
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setStatus("❌ " + err.message);
    }
  };

  const fetchShipments = async () => {
    setLoading(true);
    setShipments([]);
    try {
      const creds = await Auth.currentCredentials();
      const client = new DynamoDBClient({
        region: "us-east-1",
        credentials: Auth.essentialCredentials(creds),
      });

      // Get the Identity Pool ID instead of User Pool ID
      const identityId = creds.identityId;

      const cmd = new QueryCommand({
        TableName: "LogisticsData",
        KeyConditionExpression: "CompanyID = :cid",
        ExpressionAttributeValues: {
          ":cid": { S: identityId },
        },
      });

      const resp = await client.send(cmd);
      const items = (resp.Items || []).map((i) => ({
        ShipmentID: i.ShipmentID.S,
        OrderID: i.OrderID.S,
        Origin: i.Origin.S,
        Destination: i.Destination.S,
        Weight_kg: i.Weight_kg.S,
        DispatchDate: i.DispatchDate.S,
        ExpectedDeliveryDate: i.ExpectedDeliveryDate?.S || null,
        ActualDeliveryDate: i.ActualDeliveryDate?.S || null,
      }));
      setShipments(items);
    } catch (e) {
      console.error("Fetch shipments error", e);
    }
    setLoading(false);
  };

  const fetchAdminShipments = async () => {
    // Only proceed if user is verified as admin
    try {
      // Double-check admin status before proceeding
      const session = await Auth.currentSession();
      const groups = session.getIdToken().payload['cognito:groups'] || [];
      
      if (!groups.includes('Admin')) {
        console.error("Unauthorized admin access attempt");
        throw new Error("Unauthorized: Admin access required");
      }
      
      const token = session.getIdToken().getJwtToken();
      
      console.log("Fetching admin data...");
      
      const response = await fetch('https://u4l4348xxi.execute-api.us-east-1.amazonaws.com/prod/shipments', {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.shipments;
    } catch (error) {
      console.error("Admin fetch error:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    resetStates();
    await Auth.signOut();
    setStep("signin");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <Navbar user={user} handleSignOut={handleSignOut} />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Content Area - Conditional Rendering Based on User Role */}
        {isAdmin ? (
          /* Admin Users - Show only Admin Dashboard */
          <AdminDashboard fetchAdminShipments={fetchAdminShipments} />
        ) : (
          /* Regular Users - Show tabs and respective content */
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex">
                <button
                  className={`py-4 px-6 font-medium text-sm ${
                    activeTab === "upload"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab("upload")}
                >
                  Upload Data
                </button>
                <button
                  className={`py-4 px-6 font-medium text-sm ${
                    activeTab === "shipments"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setActiveTab("shipments");
                    if (shipments.length === 0) fetchShipments();
                  }}
                >
                  View Shipments
                </button>
                <button
                  className={`py-4 px-6 font-medium text-sm ${
                    activeTab === "analytics"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setActiveTab("analytics");
                    if (shipments.length === 0) fetchShipments();
                  }}
                >
                  Analytics
                </button>
              </nav>
            </div>

            {/* Content area */}
            <div className={`${activeTab === "upload" ? "flex-1 flex items-center justify-center" : ""}`}>
              {activeTab === "upload" && (
                <UploadTab file={file} setFile={setFile} status={status} handleUpload={handleUpload} />
              )}

              {activeTab === "shipments" && (
                <ShipmentsTab shipments={shipments} loading={loading} fetchShipments={fetchShipments} />
              )}

              {activeTab === "analytics" && (
                <AnalyticsTab shipments={shipments} loading={loading} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

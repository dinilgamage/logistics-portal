import React, { useState, useEffect } from 'react';
import { Auth, Storage } from 'aws-amplify';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { useAuth } from './auth/AuthProvider';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import Confirm from './auth/Confirm';

// Import components
import Navbar from './components/Navbar';
import UploadTab from './components/UploadTab';
import ShipmentsTab from './components/ShipmentsTab';
import AnalyticsTab from './components/AnalyticsTab'; // Import the new component
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const { user, step, setStep } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'shipments' or 'analytics'

  // Reset states when user changes or logs in
  useEffect(() => {
    if (step === 'authenticated') {
      resetStates();
    }
  }, [step, user?.username]);

  // Function to reset all states
  const resetStates = () => {
    setFile(null);
    setStatus('');
    setShipments([]);
    setLoading(false);
    setActiveTab('upload');
  };

  if (step === 'loading') return <LoadingScreen />;
  if (step === 'signin')  return <SignIn />;
  if (step === 'signup')  return <SignUp />;
  if (step === 'confirm') return <Confirm />;

  // ─────────── Authenticated portal ───────────
  const handleUpload = async () => {
    if (!file) return;
    setStatus('Uploading…');

    const email     = user.attributes.email.replace(/[^\w.@-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const key       = `${email}/${timestamp}-${file.name}`;

    try {
      await Storage.put(key, file, {
        level: 'private',
        contentType: file.type,
        progressCallback: p =>
          setStatus(`Uploading… ${Math.round((p.loaded / p.total) * 100)}%`)
      });
      setStatus('✅ Uploaded!');
      setFile(null);
      
      // Show success message with animation
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('❌ ' + err.message);
    }
  };

  const fetchShipments = async () => {
    setLoading(true);
    setShipments([]);
    try {
      const creds = await Auth.currentCredentials();
      const client = new DynamoDBClient({
        region: 'us-east-1',
        credentials: Auth.essentialCredentials(creds)
      });
      const identityId = creds.identityId;
      const cmd = new ScanCommand({
        TableName: 'LogisticsData',
        ExpressionAttributeValues: {
          ':cid': { S: identityId }
        },
        FilterExpression: 'CompanyID = :cid'
      });
      const resp = await client.send(cmd);
      const items = (resp.Items || []).map(i => ({
        ShipmentID:           i.ShipmentID.S,
        OrderID:              i.OrderID.S,
        Origin:               i.Origin.S,
        Destination:          i.Destination.S,
        Weight_kg:            i.Weight_kg.S,
        DispatchDate:         i.DispatchDate.S,
        ExpectedDeliveryDate: i.ExpectedDeliveryDate?.S || null,
        ActualDeliveryDate:   i.ActualDeliveryDate?.S || null
      }));
      setShipments(items);
    } catch (e) {
      console.error('Fetch shipments error', e);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    resetStates();
    await Auth.signOut();
    setStep('signin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <Navbar user={user} handleSignOut={handleSignOut} />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex">
            <button
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Data
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'shipments'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                setActiveTab('shipments');
                if (shipments.length === 0) fetchShipments();
              }}
            >
              View Shipments
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                setActiveTab('analytics');
                if (shipments.length === 0) fetchShipments();
              }}
            >
              Analytics
            </button>
          </nav>
        </div>
        
        {/* Content area */}
        <div className={`${activeTab === 'upload' ? 'flex-1 flex items-center justify-center' : ''}`}>
          {activeTab === 'upload' && (
            <UploadTab 
              file={file} 
              setFile={setFile}
              status={status}
              handleUpload={handleUpload}
            />
          )}

          {activeTab === 'shipments' && (
            <ShipmentsTab 
              shipments={shipments}
              loading={loading}
              fetchShipments={fetchShipments}
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsTab 
              shipments={shipments}
              loading={loading}
            />
          )}
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
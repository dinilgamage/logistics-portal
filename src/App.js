// src/App.js
import React, { useState } from 'react';
import { Auth, Storage } from 'aws-amplify';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { useAuth } from './auth/AuthProvider';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import Confirm from './auth/Confirm';

export default function App() {
  const { user, step, setStep } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (step === 'loading') return null;
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
        ShipmentID:   i.ShipmentID.S,
        OrderID:      i.OrderID.S,
        Origin:       i.Origin.S,
        Destination:  i.Destination.S,
        Weight_kg:    i.Weight_kg.S,
        DispatchDate: i.DispatchDate.S
      }));
      setShipments(items);
    } catch (e) {
      console.error('Fetch shipments error', e);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xxl mx-auto">
      <h2 className="text-xl font-semibold mb-2">Welcome, {user.username}</h2>
      <p className="mb-4 text-gray-600">{user.attributes.email}</p>

      <input
        type="file"
        accept=".xlsx"
        onChange={e => setFile(e.target.files[0])}
        className="mb-4"
      />

      <button
        className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-40"
        onClick={handleUpload}
        disabled={!file}
      >
        Upload
      </button>

      {status && <p className="mt-2">{status}</p>}

      <button
        className="mt-6 bg-green-600 text-white py-2 px-4 rounded disabled:opacity-40"
        onClick={fetchShipments}
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Show My Shipments'}
      </button>

      {shipments.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ShipmentID</th>
                <th className="p-2 border">OrderID</th>
                <th className="p-2 border">Origin</th>
                <th className="p-2 border">Destination</th>
                <th className="p-2 border">Weight (kg)</th>
                <th className="p-2 border">DispatchDate</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s, i) => (
                <tr key={i}>
                  <td className="p-2 border">{s.ShipmentID}</td>
                  <td className="p-2 border">{s.OrderID}</td>
                  <td className="p-2 border">{s.Origin}</td>
                  <td className="p-2 border">{s.Destination}</td>
                  <td className="p-2 border">{s.Weight_kg}</td>
                  <td className="p-2 border">{s.DispatchDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        className="mt-6 text-blue-600 underline"
        onClick={async () => {
          await Auth.signOut();
          setStep('signin');
        }}
      >
        Sign out
      </button>
    </div>
  );
}

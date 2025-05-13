import React, { useState } from 'react';
import { Auth, Storage } from 'aws-amplify';
import { useAuth } from './auth/AuthProvider';
import SignIn from './auth/SignIn';
import SignUp from './auth/SignUp';
import Confirm from './auth/Confirm';

export default function App() {
  const { user, step, setStep } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  if (step === 'loading') return null;
  if (step === 'signin')  return <SignIn />;
  if (step === 'signup')  return <SignUp />;
  if (step === 'confirm') return <Confirm />;

  // ─────────── Authenticated portal ───────────
  const handleUpload = async () => {
    if (!file) return;
    setStatus('Uploading…');

    const email      = user.attributes.email.replace(/[^\w.@-]/g, '_');
    const timestamp  = new Date().toISOString().replace(/[:.]/g, '');
    const key        = `${email}/${timestamp}-${file.name}`;

    try {
      await Storage.put(key, file, {
        level: 'private',
        contentType: file.type,
        progressCallback: p => setStatus(`Uploading… ${Math.round(p.loaded / p.total * 100)}%`)
      });
      setStatus('✅ Uploaded!');
    } catch (err) {
      console.error(err);
      setStatus('❌ ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">Welcome, {user.username}</h2>
      <p className="mb-4 text-gray-600">{user.attributes.email}</p>

      <input type="file" accept=".xlsx"
        onChange={e => setFile(e.target.files[0])}
        className="mb-4" />

      <button
        className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-40"
        onClick={handleUpload}
        disabled={!file}
      >
        Upload
      </button>

      {status && <p className="mt-2">{status}</p>}

      <button
        className="mt-6 text-blue-600 underline"
        onClick={async () => { await Auth.signOut(); setStep('signin'); }}
      >
        Sign out
      </button>
    </div>
  );
}

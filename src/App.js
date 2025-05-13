// src/App.js
import React, { useState } from 'react';
import { Storage } from 'aws-amplify';                 // v4 default APIs
import {
  withAuthenticator,
  Button,
  Heading,
  Text,
} from '@aws-amplify/ui-react';

const formFields = {
  signUp: {
    username: { label: 'Username', placeholder: 'Enter a username', isRequired: true },
    email:    { label: 'Email',    placeholder: 'you@example.com',  isRequired: true },
    password: { label: 'Password', placeholder: 'Enter a password', isRequired: true }
  }
};

function App({ signOut, user }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleChange = e => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;

    setStatus('Uploading…');

    try {
      // 1.  IdentityId for folder isolation
      // const { identityId } = await Auth.currentCredentials();

      // 2.  User e-mail
      const email = user.attributes.email.replace(/[^\w.@-]/g, '_'); // safe

      // 3.  Timestamp (sortable, no colons)
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '');

      // 4.  Final key
      const key = `${email}/${timestamp}-${file.name}`;

      // 5.  Upload at protected level
      await Storage.put(key, file, {
        level: 'private',                                 // adds protected/
        contentType: file.type,
        progressCallback: prog =>
          setStatus(`Uploading… ${Math.round((prog.loaded / prog.total) * 100)}%`)
      });

      setStatus(`✅ Upload successful → ${key}`);
    } catch (err) {
      console.error(err);
      setStatus('❌ Upload failed: ' + err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Heading level={3}>Welcome, {user.username}</Heading>
      <Text>{user.attributes.email}</Text>

      <input type="file" accept=".xlsx" onChange={handleChange} className="my-4" />
      <Button onClick={handleUpload} isDisabled={!file}>
        Upload
      </Button>

      {status && <Text className="mt-2">{status}</Text>}

      <Button variation="link" onClick={signOut} className="mt-4">
        Sign out
      </Button>
    </div>
  );
}

export default withAuthenticator(App, {formFields});

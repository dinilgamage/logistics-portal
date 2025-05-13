import { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useAuth } from './AuthProvider';

export default function Confirm() {
  const { setStep } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const username = localStorage.getItem('pendingUser');

  const submit = async e => {
    e.preventDefault();
    try {
      await Auth.confirmSignUp(username, code);
      setStep('signin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-2xl font-bold mb-6">Confirm sign-up</h1>
      <p className="mb-4">Enter the code sent to your email.</p>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border p-2 rounded"
          placeholder="Confirmation code"
          value={code}
          onChange={e => setCode(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">Confirm</button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useAuth } from './AuthProvider';

export default function SignUp() {
  const { setStep } = useAuth();
  const [f, sF] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      await Auth.signUp({
        username: f.username,
        password: f.password,
        attributes: { email: f.email }
      });
      localStorage.setItem('pendingUser', f.username);
      setStep('confirm');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-2xl font-bold mb-6">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border p-2 rounded" placeholder="Username"
          value={f.username} onChange={e => sF({ ...f, username: e.target.value })} />
        <input className="w-full border p-2 rounded" placeholder="Email"
          value={f.email} onChange={e => sF({ ...f, email: e.target.value })} />
        <input type="password" className="w-full border p-2 rounded" placeholder="Password"
          value={f.password} onChange={e => sF({ ...f, password: e.target.value })} />
        {error && <p className="text-red-600">{error}</p>}
        <button className="w-full bg-green-600 text-white py-2 rounded">Sign up</button>
      </form>
      <p className="mt-4">
        Have an account?{' '}
        <button className="text-blue-600" onClick={() => setStep('signin')}>
          Sign in
        </button>
      </p>
    </div>
  );
}

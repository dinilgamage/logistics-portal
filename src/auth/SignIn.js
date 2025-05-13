import { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useAuth } from './AuthProvider';

export default function SignIn() {
  const { setUser, setStep } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      const u = await Auth.signIn(form.username, form.password);
      setUser(u);
      setStep('app');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-red-600">{error}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Sign in
        </button>
      </form>

      <p className="mt-4">
        No account?{' '}
        <button className="text-blue-600" onClick={() => setStep('signup')}>
          Sign up
        </button>
      </p>
    </div>
  );
}

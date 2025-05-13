import { useState } from 'react';
import { Auth } from 'aws-amplify';
import { useAuth } from './AuthProvider';

export default function SignIn() {
  const { setUser, setStep } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const u = await Auth.signIn(form.username, form.password);
      setUser(u);
      setStep('app');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        />
        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          disabled={isLoading}
        />
        {error && <p className="text-red-600">{error}</p>}
        <button 
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 flex justify-center items-center"
          disabled={isLoading || !form.username || !form.password}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : "Sign in"}
        </button>
      </form>

      <p className="mt-4">
        No account?{' '}
        <button 
          className="text-blue-600 disabled:opacity-50" 
          onClick={() => setStep('signup')}
          disabled={isLoading}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

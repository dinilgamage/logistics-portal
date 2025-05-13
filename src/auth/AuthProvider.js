import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

const AuthCtx = createContext();
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('loading'); // 'signin'|'signup'|'confirm'|'app'

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(u => {
        setUser(u);
        setStep('app');
      })
      .catch(() => setStep('signin'));
  }, []);

  return (
    <AuthCtx.Provider value={{ user, setUser, step, setStep }}>
      {children}
    </AuthCtx.Provider>
  );
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const bootstrap = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        setAuthToken(token);
        router.replace('/home');
      } else {
        router.replace('/login');
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const login = async (token: string) => {
    await SecureStore.setItemAsync('authToken', token);
    setAuthToken(token);
    router.replace('/home');
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setAuthToken(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ authToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

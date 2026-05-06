import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (t: string) => {
    try {
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${t}` } });
      setUser(res.data);
      localStorage.setItem('skillx_user', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to fetch user data", err);
      logout();
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('skillx_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUserData(savedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const sendOtp = async (email: string) => {
    await api.post('/auth/send-otp', { email });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const { token: t, user: u } = res.data;
    setToken(t); setUser(u);
    localStorage.setItem('skillx_token', t);
    localStorage.setItem('skillx_user', JSON.stringify(u));
  };

  const loginWithToken = async (t: string) => {
    setToken(t);
    localStorage.setItem('skillx_token', t);
    await fetchUserData(t);
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('skillx_token');
    localStorage.removeItem('skillx_user');
  };

  const refreshUser = async () => {
    if (!token) return;
    await fetchUserData(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, sendOtp, verifyOtp, loginWithToken, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

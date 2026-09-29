'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, setSessionExpiredCallback } from './api';

interface User {
  id: string;
  email: string;
  subscription: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    api.setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    setSessionExpiredCallback(() => {
      setUser(null);
      router.push('/login');
    });

    const token = localStorage.getItem('token');
    if (token) {
      api.setToken(token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (exp < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          api.setToken(null);
          setLoading(false);
          return;
        }
        setUser({ id: payload.accountId, email: payload.email || '', subscription: payload.subscription || 'free' });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);

    return () => setSessionExpiredCallback(null);
  }, [router]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    api.setToken(data.accessToken);
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    setUser({ id: payload.accountId, email, subscription: 'free' });
  };

  const register = async (email: string, password: string) => {
    const data = await api.post<{ user: { id: string; email: string }; accessToken: string; refreshToken: string }>('/auth/register', { email, password });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    api.setToken(data.accessToken);
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    setUser({ id: payload.accountId, email, subscription: 'free' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

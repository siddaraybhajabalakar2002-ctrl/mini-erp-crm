import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: Role }) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const roleCredentials: Record<Role, { email: string; name: string }> = {
  ADMIN: { email: 'admin@minierp.com', name: 'Alex Rivera (Admin)' },
  SALES: { email: 'sales@minierp.com', name: 'Sarah Connor (Sales)' },
  WAREHOUSE: { email: 'warehouse@minierp.com', name: 'Walter White (Warehouse)' },
  ACCOUNTS: { email: 'accounts@minierp.com', name: 'Amy Santiago (Accounts)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erp_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('Session expired', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('erp_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const register = async (data: { name: string; email: string; password: string; role?: Role }) => {
    const res = await authAPI.register(data);
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('erp_token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitchRole = async (role: Role) => {
    const creds = roleCredentials[role];
    if (creds) {
      await login(creds.email, 'password123');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

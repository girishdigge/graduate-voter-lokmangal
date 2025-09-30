import React, { useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
import { AuthContext, type User, type AuthContextType } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (
    aadharNumber: string
  ): Promise<{ exists: boolean; user?: User }> => {
    try {
      setIsLoading(true);
      const response = await api.post('/aadhar/check', { aadharNumber });

      if (response.data.exists) {
        const userData = response.data.user;
        const token = response.data.token;

        setUser(userData);
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));

        return { exists: true, user: userData };
      }

      return { exists: false };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

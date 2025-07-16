import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../services/api';
import type { User, AuthContextType, CreateUserDto } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      // Check if token is corrupted (contains [object Object])
      if (savedToken.includes('[object Object]')) {
        // Clear corrupted token
        localStorage.removeItem('auth_token');
        apiClient.clearToken();
      } else {
        setToken(savedToken);
        apiClient.setToken(savedToken);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.login({ email, password });
      const { access_token } = response;
      
      // Validate token is a string
      if (typeof access_token !== 'string') {
        throw new Error('Invalid token received from server');
      }
      
      setToken(access_token);
      apiClient.setToken(access_token);
      localStorage.setItem('auth_token', access_token);
      
      // Get user data after successful login
      const userData = await apiClient.getUserByEmail(email);
      setUser(userData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: CreateUserDto) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.register(userData);
      console.log('Registration response:', response);
      const { access_token, data } = response;
      console.log('Access token:', access_token, 'Type:', typeof access_token);
      
      // Validate token is a string
      if (typeof access_token !== 'string') {
        throw new Error(`Invalid token received from server. Got: ${typeof access_token}, Value: ${access_token}`);
      }
      
      setToken(access_token);
      setUser(data);
      apiClient.setToken(access_token);
      
      // Ensure token is persisted before proceeding
      localStorage.setItem('auth_token', access_token);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

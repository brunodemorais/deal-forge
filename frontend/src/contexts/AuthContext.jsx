import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user info from backend
          const userData = await apiClient.get('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        // If login returns user data, use it. Otherwise fetch /auth/me
        const userData = data.user || await apiClient.get('/auth/me');
        setUser(userData);
        return { error: null };
      }
      return { error: 'No token received' };
    } catch (error) {
      return { error: error.message || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      await apiClient.post('/auth/register', { email, password });
      // Automatically login after registration or let the user do it
      // For this implementation, we'll return success and let the UI handle the redirect
      return { error: null };
    } catch (error) {
      return { error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
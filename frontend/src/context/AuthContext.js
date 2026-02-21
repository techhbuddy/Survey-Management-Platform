import React, { createContext, useState, useCallback, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const userData = await authService.getProfile();
          setUser(userData.data.data);
        }
      } catch (error) {
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      authService.setToken(response.data.data.token);
      setUser(response.data.data.user);
      return response.data.data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await authService.register(data);
      authService.setToken(response.data.data.token);
      setUser(response.data.data.user);
      return response.data.data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const setToken = useCallback(async (token) => {
    authService.setToken(token);
    try {
      const response = await authService.getProfile();
      setUser(response.data.data);
    } catch (err) {
      // If token invalid, clear it
      authService.logout();
      setUser(null);
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        getProfile,
        setToken,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

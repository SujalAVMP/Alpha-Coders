import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, login, register } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Loading user...');
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          console.log('No token found');
          setLoading(false);
          return;
        }

        console.log('Getting current user...');
        const res = await getCurrentUser();
        console.log('Current user:', res.data);
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        setError(err.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const registerUser = async (userData) => {
    try {
      console.log('Registering user:', userData);
      setLoading(true);
      setError(null);
      const res = await register(userData);
      console.log('Registration response:', res.data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return res.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const loginUser = async (userData) => {
    try {
      console.log('Logging in user:', userData);
      setLoading(true);
      setError(null);
      const res = await login(userData);
      console.log('Login response:', res.data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        registerUser,
        loginUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

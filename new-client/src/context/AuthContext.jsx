import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, login, register, deleteUserAccount } from '../utils/api';

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
        const data = await getCurrentUser();
        console.log('Current user:', data);
        setUser(data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        setError(err.message || 'An error occurred');
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
      const data = await register(userData);
      console.log('Registration response:', data);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
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
      const data = await login(userData);
      console.log('Login response:', data);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
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

  // Delete account
  const deleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteUserAccount();
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true, message: 'Account deleted successfully' };
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
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
        logout,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

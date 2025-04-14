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
        // Clear any existing tokens to ensure no one is logged in initially
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        console.log('Cleared any existing tokens');
        setLoading(false);
      } catch (err) {
        console.error('Error in initial auth setup:', err);
        setError(err.message || 'An error occurred');
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
      localStorage.setItem('userEmail', userData.email);
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
      localStorage.setItem('userEmail', userData.email);
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
    localStorage.removeItem('userEmail');
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
      localStorage.removeItem('userEmail');
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

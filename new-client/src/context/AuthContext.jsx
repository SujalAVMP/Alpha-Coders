import React, { createContext, useState, useEffect } from 'react';
import { getCurrentUser, login, register, deleteUserAccount } from '../utils/api';

export const AuthContext = createContext();

// Helper functions for session storage
const getSessionToken = () => sessionStorage.getItem('token');
const getSessionId = () => sessionStorage.getItem('sessionId');
const getSessionEmail = () => sessionStorage.getItem('userEmail');

const setSessionData = (token, sessionId, email) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('sessionId', sessionId);
  sessionStorage.setItem('userEmail', email);
};

const clearSessionData = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('sessionId');
  sessionStorage.removeItem('userEmail');
};

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
        const token = getSessionToken();
        const sessionId = getSessionId();
        const email = getSessionEmail();

        if (token && sessionId && email) {
          console.log('Found session data, attempting to restore session');
          try {
            // Try to get the current user with the stored token and session ID
            const userData = await getCurrentUser(email);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('Session restored successfully');
          } catch (sessionErr) {
            console.error('Failed to restore session:', sessionErr);
            clearSessionData();
          }
        } else {
          console.log('No session data found');
          clearSessionData();
        }

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

      // Store session data
      setSessionData(data.token, data.sessionId, userData.email);

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

      // Store session data
      setSessionData(data.token, data.sessionId, userData.email);

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
  const logout = async () => {
    try {
      // Call the logout API endpoint
      const response = await fetch('http://localhost:5002/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSessionToken()}`,
          'X-Session-ID': getSessionId()
        }
      });

      if (!response.ok) {
        console.error('Logout API call failed:', response.statusText);
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear session data regardless of API call success
      clearSessionData();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteUserAccount();
      clearSessionData();
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
        deleteAccount,
        getSessionId, // Expose session ID getter for API calls
        getSessionToken // Expose token getter for API calls
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

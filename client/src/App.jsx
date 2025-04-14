import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import LandingPage from './components/common/LandingPage';
import TestComponent from './components/common/TestComponent';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import TestsList from './components/dashboard/TestsList';
import SubmissionsList from './components/dashboard/SubmissionsList';
import TestPage from './components/coding/TestPage';
import SubmissionDetails from './components/coding/SubmissionDetails';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/test" element={<TestComponent />} />

                {/* Private Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tests" element={<TestsList />} />
                  <Route path="/tests/:id" element={<TestPage />} />
                  <Route path="/submissions" element={<SubmissionsList />} />
                  <Route path="/submissions/:id" element={<SubmissionDetails />} />
                </Route>

                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Redirect other routes to dashboard if authenticated, otherwise to landing page */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

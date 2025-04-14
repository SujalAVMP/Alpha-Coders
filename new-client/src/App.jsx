import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import LandingPage from './components/common/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import TestsList from './components/dashboard/TestsList';
import SubmissionsList from './components/dashboard/SubmissionsList';
import Profile from './components/dashboard/Profile';
import TestPage from './components/coding/TestPage';
import SubmissionDetails from './components/coding/SubmissionDetails';

// New Components
import TestEditor from './components/tests/TestEditor';
import AssessmentEditor from './components/assessments/AssessmentEditor';
import AssessmentDetails from './components/assessments/AssessmentDetails';
import AssessmentsList from './components/assessments/AssessmentsList';
import AssessmentView from './components/assessments/AssessmentView';
import AssessmentDetailsView from './components/assessments/AssessmentDetailsView';
import InvitationAcceptance from './components/assessments/InvitationAcceptance';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Indigo
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057', // Pink
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
      50: '#e8f5e9',
    },
    error: {
      main: '#f44336',
      light: '#ff7961',
      dark: '#ba000d',
      50: '#ffebee',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out',
          },
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
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
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Private Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tests" element={<TestsList />} />
                  <Route path="/tests/new" element={<TestEditor />} />
                  <Route path="/tests/:id/edit" element={<TestEditor />} />
                  <Route path="/tests/:id" element={<TestPage />} />
                  <Route path="/submissions" element={<SubmissionsList />} />
                  <Route path="/submissions/:id" element={<SubmissionDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/assessments" element={<AssessmentsList />} />
                  <Route path="/assessments/new" element={<AssessmentEditor />} />
                  <Route path="/assessments/:assessmentId/edit" element={<AssessmentEditor />} />
                  <Route path="/assessments/:assessmentId" element={<AssessmentDetailsView />} />
                  <Route path="/assessments/:assessmentId/details" element={<AssessmentDetails />} />
                  <Route path="/assessments/:assessmentId/view" element={<AssessmentView />} />
                  <Route path="/assessments/:assessmentId/invitation" element={<InvitationAcceptance />} />
                </Route>

                {/* Fallback Route */}
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

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import AssessorDashboard from './AssessorDashboard';
import AssesseeDashboard from './AssesseeDashboard';

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Render the appropriate dashboard based on user role
  if (user.role === 'assessor') {
    return <AssessorDashboard />;
  } else {
    return <AssesseeDashboard />;
  }
};

export default Dashboard;

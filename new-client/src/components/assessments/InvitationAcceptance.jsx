import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAssessmentById, fetchAPI } from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useIsMobile, useIsTablet, getResponsivePadding } from '../../utils/responsive';

const InvitationAcceptance = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const queryParams = new URLSearchParams(location.search);
  const invitationToken = queryParams.get('token');
  const invitedEmail = queryParams.get('email');
  
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const responsivePadding = getResponsivePadding(isMobile, isTablet);

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState('pending'); // 'pending', 'success', 'error'

  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching assessment with ID:', assessmentId);
        console.log('Invitation details:', { invitationToken, invitedEmail });
        
        // Use direct API call with invitation parameters
        const url = `/assessments/${assessmentId}${invitationToken ? `?token=${invitationToken}` : ''}${invitedEmail ? `&invitedEmail=${invitedEmail}` : ''}`;
        const response = await fetchAPI(url);
        
        console.log('Assessment API response:', response);
        
        if (!response) {
          throw new Error('Failed to fetch assessment data');
        }
        
        setAssessment(response);
        setAcceptanceStatus('success');
      } catch (error) {
        console.error('Error fetching assessment:', error);
        setError('Failed to load assessment. Please try again.');
        setAcceptanceStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentDetails();
  }, [assessmentId, invitationToken, invitedEmail]);

  const handleAcceptInvitation = async () => {
    try {
      setLoading(true);
      
      // Call API to accept invitation
      const response = await fetchAPI(`/assessments/${assessmentId}/accept-invitation`, {
        method: 'POST',
        body: JSON.stringify({
          token: invitationToken,
          email: invitedEmail || user?.email
        })
      });
      
      console.log('Invitation acceptance response:', response);
      
      // Navigate to the assessment view
      navigate(`/assessments/${assessmentId}/view`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation. Please try again.');
      setAcceptanceStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Check if assessment is active (current time is between start and end time)
  const isAssessmentActive = () => {
    if (!assessment) return false;
    
    const now = new Date();
    const startTime = new Date(assessment.startTime);
    const endTime = new Date(assessment.endTime);
    
    return now >= startTime && now <= endTime;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" paragraph>
          This could be due to an invalid invitation link or the assessment may not exist.
          If you believe you should have access to this assessment, please contact the administrator.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Assessment not found or you don't have permission to view it.
        </Alert>
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: responsivePadding, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
            Assessment Invitation
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          You have been invited to take the following assessment.
        </Alert>
        
        <Typography variant="h5" gutterBottom>
          {assessment.title}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {assessment.description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Assessment Details:
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Start: {new Date(assessment.startTime).toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              End: {new Date(assessment.endTime).toLocaleString()}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={isAssessmentActive() ? "Active" : "Inactive"} 
              color={isAssessmentActive() ? "success" : "error"}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mt: 3 }}>
          {isAssessmentActive() ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleAcceptInvitation}
              endIcon={<ArrowForwardIcon />}
              fullWidth={isMobile}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept Invitation & Start Assessment'}
            </Button>
          ) : (
            <Alert severity="warning">
              This assessment is not currently active. You can only take it during the scheduled time period.
            </Alert>
          )}
          
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{ mt: 2 }}
            fullWidth={isMobile}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvitationAcceptance;

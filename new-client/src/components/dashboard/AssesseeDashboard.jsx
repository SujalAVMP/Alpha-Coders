import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { getAssignedAssessments, getCurrentUser } from '../../utils/api';

const AssesseeDashboard = () => {
  const { user } = useContext(AuthContext);

  // Removed unused tests state
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Removed URL change watcher for submissions tab

  // Add a new useEffect to ensure user data is properly loaded
  useEffect(() => {
    const loadUser = async () => {
      if (localStorage.getItem('token')) {
        try {
          console.log('Loading current user data...');
          const userData = await getCurrentUser();
          console.log('Current user data loaded:', userData);
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      }
    };

    loadUser();
  }, []);

  // Define the fetchData function outside useEffect so it can be reused
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Initialize with empty arrays
      // Removed setTests call
      setAssessments([]);

      // Ensure we have user data before proceeding
      if (!user || !user.email) {
        console.log('No user data available, skipping data fetch');
        setLoading(false);
        return;
      }

      // Removed notifications fetching code

      // Fetch assigned assessments - these are the only ones the assessee should see
      try {
        console.log('Fetching assigned assessments for user:', user?.email);
        const assignedAssessmentsData = await getAssignedAssessments();
        console.log('Received assigned assessments:', assignedAssessmentsData);

        // The API now only returns assessments the user is specifically invited to
        if (assignedAssessmentsData?.length > 0) {
          // Make sure each assessment has the required properties
          const processedAssessments = assignedAssessmentsData.map(assessment => ({
            ...assessment,
            attemptsUsed: assessment.attemptsUsed || 0,
            maxAttempts: assessment.maxAttempts || 1,
            isNewInvitation: assessment.isNewInvitation || false,
            submitted: assessment.submitted || false,
            submittedAt: assessment.submittedAt || null
          }));

          // Log each assessment's submission status
          processedAssessments.forEach(assessment => {
            console.log('Assessment submission status:', {
              id: assessment.id,
              title: assessment.title,
              submitted: assessment.submitted,
              submittedAt: assessment.submittedAt
            });
          });

          setAssessments(processedAssessments);
          console.log('Set assessments state with:', processedAssessments);
        } else {
          console.log('No assigned assessments found');
          setAssessments([]);
        }
      } catch (err) {
        console.error('Error fetching assigned assessments:', err);
        setAssessments([]);
      }

      // Removed user submissions fetching code

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Use the fetchData function in useEffect
  useEffect(() => {
    fetchData();
  }, [user]);

  // Add a refresh function
  const refreshDashboard = () => {
    console.log('Refreshing dashboard...');
    fetchData();
  };

  // Removed unused getTestById function

  const isAssessmentActive = (assessment) => {
    if (!assessment) return false;

    const now = new Date();
    const startTime = new Date(assessment.startTime);
    const endTime = new Date(assessment.endTime);
    return now >= startTime && now <= endTime && !assessment.submitted;
  };

  const isAssessmentSubmitted = (assessment) => {
    if (!assessment) return false;

    // Log both id and _id for debugging
    const assessmentId = assessment.id || assessment._id;
    console.log('Checking if assessment is submitted:', assessmentId, assessment.title, assessment.submitted);
    return assessment.submitted === true;
  };

  // Removed unused canTakeAssessment function

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }} className="dashboard-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Assessments
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Welcome, {user?.name || 'Student'}!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={refreshDashboard}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4, p: 3 }} className="content-card">
        {/* Active Tests Content */}
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Tests will appear here when an assessor invites you to take them. You can only see tests that you've been specifically invited to.
          </Alert>

            {/* Active Tests Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Active Tests
            </Typography>

            {assessments.filter(a => isAssessmentActive(a)).length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', mb: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  You don't have any active tests at the moment.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {assessments.filter(assessment => isAssessmentActive(assessment)).map(assessment => {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={assessment.id}>
                      <Card sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {assessment.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {assessment.description || 'No description provided'}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              Due: {new Date(assessment.endTime).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                              Tests: {Array.isArray(assessment.tests) ? assessment.tests.length : 0}
                            </Typography>
                          </Box>
                          {assessment.isNewInvitation && (
                            <Chip label="New" size="small" color="primary" sx={{ mt: 1 }} />
                          )}
                        </CardContent>

                        <Divider />

                        <CardActions>
                          <Button
                            component={Link}
                            to={`/assessments/${assessment._id}/view`}
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ py: 1 }}
                          >
                            View Assessment
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {/* Past Tests Section */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 4 }}>
              Past Tests
            </Typography>

            {assessments.filter(a => isAssessmentSubmitted(a)).length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="body1" color="textSecondary">
                  You haven't submitted any tests yet.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {assessments.filter(assessment => isAssessmentSubmitted(assessment)).map(assessment => {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={assessment.id}>
                      <Card sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        bgcolor: '#f5f5f5'
                      }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" component="h2" gutterBottom>
                              {assessment.title}
                            </Typography>
                            <Chip label="Submitted" size="small" color="success" />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {assessment.description || 'No description provided'}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              Submitted: {assessment.submittedAt ? new Date(assessment.submittedAt).toLocaleDateString() : 'Unknown'}
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                              Tests: {Array.isArray(assessment.tests) ? assessment.tests.length : 0}
                            </Typography>
                          </Box>
                        </CardContent>

                        <Divider />

                        <CardActions>
                          <Button
                            component={Link}
                            to={`/assessments/submissions/${assessment.id}`}
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ py: 1 }}
                          >
                            View Results
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {assessments.length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', mt: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  You haven't been invited to any tests yet.
                </Typography>
              </Paper>
            )}
          </>
      </Paper>
    </Box>
  );
};

export default AssesseeDashboard;

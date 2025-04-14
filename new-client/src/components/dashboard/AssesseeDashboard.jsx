import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { getAssignedAssessments, getUserSubmissions, getNotifications, getCurrentUser } from '../../utils/api';

const AssesseeDashboard = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're viewing submissions based on URL query parameter
  const [viewingSubmissions, setViewingSubmissions] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') === 'submissions';
  });

  const [tests, setTests] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Watch for URL changes to update the view
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setViewingSubmissions(urlParams.get('tab') === 'submissions');
  }, [location]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Initialize with empty arrays
        setTests([]);
        setAssessments([]);

        // Ensure we have user data before proceeding
        if (!user || !user.email) {
          console.log('No user data available, skipping data fetch');
          setLoading(false);
          return;
        }

        // Fetch notifications first
        try {
          console.log('Fetching notifications for user:', user.email);
          const notificationsData = await getNotifications();
          console.log('Received notifications:', notificationsData);
          setNotifications(notificationsData || []);

          // Check for unread invitation notifications
          const unreadInvitations = notificationsData?.filter(n =>
            n.type === 'invitation'
          ) || [];

          console.log('Invitation notifications:', unreadInvitations);

          if (unreadInvitations.length > 0) {
            setError(
              <Alert severity="info" sx={{ mb: 3 }}>
                You have {unreadInvitations.length} assessment invitation(s).
              </Alert>
            );
          }
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }

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
              isNewInvitation: assessment.isNewInvitation || false
            }));

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

        // Fetch user submissions
        try {
          const submissionsData = await getUserSubmissions();
          setSubmissions(submissionsData || []);
        } catch (err) {
          console.error('Error fetching user submissions:', err);
          setSubmissions([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getTestById = (testId) => {
    return tests.find(test => test._id === testId) || { title: 'Unknown Test' };
  };

  const isAssessmentActive = (assessment) => {
    const now = new Date();
    const startTime = new Date(assessment.startTime);
    const endTime = new Date(assessment.endTime);
    return now >= startTime && now <= endTime;
  };

  const canTakeAssessment = (assessment) => {
    return isAssessmentActive(assessment) && assessment.attemptsUsed < assessment.maxAttempts;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }} className="dashboard-container">
      <Typography variant="h4" component="h1" gutterBottom>
        {viewingSubmissions ? 'My Submissions' : 'Active Tests'}
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.name || 'Student'}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4, p: 3 }} className="content-card">
        {/* Show either Active Tests or My Submissions based on URL parameter */}
        {!viewingSubmissions ? (
          // Active Tests Content
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Tests will appear here when an assessor invites you to take them. You can only see tests that you've been specifically invited to.
            </Alert>

            {assessments.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="body1" color="textSecondary">
                  You haven't been invited to any tests yet.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {assessments.map(assessment => {
                  return (
                    <Grid item xs={12} sm={6} md={4} key={assessment.id}>
                      <Card sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        opacity: isAssessmentActive(assessment) ? 1 : 0.7
                      }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {assessment.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
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
                            to={`/assessments/${assessment.id}/view`}
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!isAssessmentActive(assessment)}
                            sx={{ py: 1 }}
                          >
                            {isAssessmentActive(assessment) ? 'View Assessment' : 'Assessment Unavailable'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        ) : (
          // My Submissions Content
          <>
            {submissions.length === 0 ? (
              <Alert severity="info">
                You haven't submitted any tests yet.
              </Alert>
            ) : (
              <List>
                {submissions.map((submission) => {
                  const test = getTestById(submission.testId);

                  return (
                    <Paper key={submission.id} variant="outlined" sx={{ mb: 2 }}>
                      <ListItem
                        component={Link}
                        to={`/submissions/${submission.id}`}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              {test.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 1 }}>
                                <Chip
                                  label={submission.language.toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Score: ${submission.score}%`}
                                  size="small"
                                  color={submission.score >= 70 ? 'success' : 'error'}
                                  icon={submission.score >= 70 ? <CheckCircleIcon /> : <ErrorIcon />}
                                />
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            component={Link}
                            to={`/submissions/${submission.id}`}
                          >
                            View Details
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  );
                })}
              </List>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AssesseeDashboard;

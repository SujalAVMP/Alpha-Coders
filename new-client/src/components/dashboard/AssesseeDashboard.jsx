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

  // Define the fetchData function outside useEffect so it can be reused
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

  // Use the fetchData function in useEffect
  useEffect(() => {
    fetchData();
  }, [user]);

  // Add a refresh function
  const refreshDashboard = () => {
    console.log('Refreshing dashboard...');
    fetchData();
  };

  const getTestById = (testId) => {
    // Handle both _id and id formats
    return tests.find(test => (test._id === testId || test.id === testId)) || { title: 'Unknown Test' };
  };

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

  const canTakeAssessment = (assessment) => {
    if (!assessment) return false;

    // Default maxAttempts to 1 if not specified
    const maxAttempts = assessment.maxAttempts || 1;
    // Default attemptsUsed to 0 if not specified
    const attemptsUsed = assessment.attemptsUsed || 0;

    return isAssessmentActive(assessment) && attemptsUsed < maxAttempts;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {viewingSubmissions ? 'My Submissions' : 'My Assessments'}
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
          <Button
            variant="contained"
            color={viewingSubmissions ? 'primary' : 'secondary'}
            onClick={() => {
              const newView = !viewingSubmissions;
              setViewingSubmissions(newView);
              navigate(newView ? '?tab=submissions' : '?tab=tests');
            }}
          >
            {viewingSubmissions ? 'View My Assessments' : 'View My Submissions'}
          </Button>
        </Box>
      </Box>

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
                          <Typography variant="body2" color="text.secondary" paragraph>
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
        ) : (
          // My Submissions Content
          <>
            {submissions.length === 0 ? (
              <Alert severity="info">
                You haven't submitted any assessments yet. After submitting an assessment, your results will appear here.
              </Alert>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Assessment Submissions
                </Typography>
                <Grid container spacing={3}>
                  {submissions.map((submission) => {
                    return (
                      <Grid item xs={12} sm={6} md={4} key={submission._id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="h2" gutterBottom>
                              {submission.testTitle || 'Unknown Test'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              From: {submission.assessmentTitle || 'Unknown Assessment'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              <Chip
                                label={submission.language.toUpperCase()}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`${submission.testCasesPassed}/${submission.totalTestCases} Tests`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={`Score: ${submission.score}%`}
                                size="small"
                                color={submission.score >= 70 ? 'success' : 'error'}
                                icon={submission.score >= 70 ? <CheckCircleIcon /> : <ErrorIcon />}
                              />
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              component={Link}
                              to={submission.assessmentId ?
                                `/assessments/submissions/${submission.assessmentId}` :
                                `/submissions/${submission.id}?email=${encodeURIComponent(user?.email || '')}`}
                              variant="contained"
                              color="primary"
                              fullWidth
                            >
                              View Details
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AssesseeDashboard;

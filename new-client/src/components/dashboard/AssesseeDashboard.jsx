import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
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
  ListItemSecondaryAction
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { getAssignedAssessments, getUserSubmissions, getNotifications } from '../../utils/api';

const AssesseeDashboard = () => {
  const { user } = useContext(AuthContext);

  const [tabValue, setTabValue] = useState(0);
  const [tests, setTests] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Initialize with empty arrays
        setTests([]);
        setAssessments([]);

        // Fetch notifications first
        try {
          const notificationsData = await getNotifications();
          setNotifications(notificationsData || []);

          // Check for unread invitation notifications
          const unreadInvitations = notificationsData?.filter(n =>
            n.type === 'invitation' && !n.read
          ) || [];

          if (unreadInvitations.length > 0) {
            setError(
              <Alert severity="info" sx={{ mb: 3 }}>
                You have {unreadInvitations.length} new assessment invitation(s). Check the "My Assessments" tab.
              </Alert>
            );
          }
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }

        // Fetch assigned assessments - these are the only ones the assessee should see
        try {
          const assignedAssessmentsData = await getAssignedAssessments();

          // The API now only returns assessments the user is specifically invited to
          if (assignedAssessmentsData?.length > 0) {
            setAssessments(assignedAssessmentsData);
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
          // Fallback to mock data if API fails
          const mockSubmissions = [
            {
              id: '1',
              testId: testsData ? testsData[0]?._id : '1',
              submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
              status: 'Completed',
              score: 80,
              language: 'python'
            }
          ];
          setSubmissions(mockSubmissions);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Assessee Dashboard
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.name || 'Student'}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="My Assessments" />
          <Tab label="Available Tests" />
          <Tab label="My Submissions" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Assessments Tab */}
          {tabValue === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Assigned Assessments
              </Typography>

              {assessments.length === 0 ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You don't have any assigned assessments yet. When an assessor invites you to an assessment, it will appear here.
                  </Alert>

                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Welcome to the Assessee Dashboard!
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                      As an assessee, you'll be able to take programming tests and assessments that you've been invited to.
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Check back here after you've been invited to an assessment.
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {assessments.map((assessment) => (
                    <Grid item xs={12} md={6} key={assessment.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          bgcolor: isAssessmentActive(assessment) ? 'background.paper' : 'action.disabledBackground',
                          border: assessment.isNewInvitation ? '2px solid #3f51b5' : undefined
                        }}
                      >
                        {assessment.isNewInvitation && (
                          <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 0.5, px: 2, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              New Invitation
                            </Typography>
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {assessment.title}
                          </Typography>

                          <Typography variant="body2" color="textSecondary" paragraph>
                            {assessment.description}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                              {assessment.tests.length} Tests Included
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              Start: {new Date(assessment.startTime).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              End: {new Date(assessment.endTime).toLocaleString()}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Chip
                              label={isAssessmentActive(assessment) ? 'Active' : 'Inactive'}
                              color={isAssessmentActive(assessment) ? 'success' : 'default'}
                              size="small"
                            />

                            <Typography variant="body2">
                              Attempts: {assessment.attemptsUsed}/{assessment.maxAttempts}
                            </Typography>
                          </Box>
                        </CardContent>

                        <Divider />

                        <CardActions>
                          <Button
                            component={Link}
                            to={`/assessments/${assessment.id}`}
                            variant="outlined"
                            fullWidth
                            sx={{ mr: 1 }}
                          >
                            View Details
                          </Button>

                          <Button
                            component={Link}
                            to={`/assessments/${assessment.id}/take`}
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!canTakeAssessment(assessment)}
                          >
                            {canTakeAssessment(assessment) ? 'Start Assessment' : 'Unavailable'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Available Tests Tab */}
          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Available Tests
              </Typography>

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
                  {assessments.flatMap(assessment => {
                    // Get all test IDs from assessments the user is invited to
                    return assessment.tests.map(testId => {
                      // Find the test details
                      const test = tests.find(t => t._id === testId) || {
                        _id: testId,
                        title: `Test from ${assessment.title}`,
                        description: 'Test details will be available when you start the assessment',
                        difficulty: 'Medium',
                        timeLimit: 60
                      };

                      return (
                        <Grid item xs={12} sm={6} md={4} key={`${assessment.id}-${testId}`}>
                          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="h2" gutterBottom>
                                {test.title}
                              </Typography>

                              <Typography variant="body2" color="textSecondary" paragraph>
                                {test.description || 'No description provided'}
                              </Typography>

                              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                                Part of: {assessment.title}
                              </Typography>

                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip
                                  label={test.difficulty}
                                  size="small"
                                  color={
                                    test.difficulty === 'Easy' ? 'success' :
                                    test.difficulty === 'Medium' ? 'warning' : 'error'
                                  }
                                />
                                <Chip
                                  label={`${test.timeLimit} min`}
                                  size="small"
                                  icon={<AccessTimeIcon />}
                                />
                              </Box>
                            </CardContent>

                            <CardActions>
                              <Button
                                component={Link}
                                to={`/assessments/${assessment.id}`}
                                variant="outlined"
                                fullWidth
                                sx={{ mr: 1 }}
                              >
                                View Assessment
                              </Button>
                              <Button
                                component={Link}
                                to={`/tests/${test._id}`}
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={!isAssessmentActive(assessment)}
                              >
                                Take Test
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      );
                    });
                  })}
                </Grid>
              )}
            </>
          )}

          {/* Submissions Tab */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                My Submissions
              </Typography>

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
        </Box>
      </Paper>
    </Box>
  );
};

export default AssesseeDashboard;

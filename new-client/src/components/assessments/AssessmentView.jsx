import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getAssessmentById, getTestById, submitAssessment, API_URL } from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  ArrowBack as ArrowBackIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useIsMobile, useIsTablet, getResponsivePadding } from '../../utils/responsive';

const AssessmentView = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const responsivePadding = getResponsivePadding(isMobile, isTablet);

  const [assessment, setAssessment] = useState(null);
  const [tests, setTests] = useState([]);
  const [testStatus, setTestStatus] = useState({});
  const [selectedTestId, setSelectedTestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Function to fetch test attempt status
  const fetchTestStatus = useCallback(async () => {
    if (!assessmentId || !assessment) return;

    try {
      const statusObj = {};
      const userEmail = localStorage.getItem('userEmail');
      const userId = localStorage.getItem('userId');

      if (!userId || !userEmail) {
        console.error('No user ID or email found in localStorage');
        toast.error('User authentication error. Please log in again.');
        return;
      }

      console.log(`Fetching test status for user ${userEmail} (${userId}) in assessment ${assessmentId}`);

      // For each test in the assessment, check if it has been attempted
      for (const test of tests) {
        try {
          // First, check if we have the status in localStorage with user-specific key
          const userTestKey = `${userId}_${test._id}`;
          const storedStatus = localStorage.getItem(`${userTestKey}_status`);
          const storedAttempts = localStorage.getItem(`${userTestKey}_attempts`);
          const storedCompleted = localStorage.getItem(`${userTestKey}_completed`);
          const lastUpdated = localStorage.getItem(`${userTestKey}_last_updated`);

          // Only use localStorage data if it's recent (less than 1 minute old)
          const isRecent = lastUpdated && (new Date() - new Date(lastUpdated)) < 60000;

          if (isRecent && (storedStatus || storedAttempts || storedCompleted)) {
            console.log(`Found recent stored status for test ${test._id} with key ${userTestKey}`);

            // Use the stored data if available and recent
            let attemptsUsed = 0;
            if (storedAttempts) {
              attemptsUsed = parseInt(storedAttempts, 10) || 0;
            }

            statusObj[test._id] = {
              attemptsUsed: attemptsUsed,
              maxAttempts: parseInt(localStorage.getItem(`${userTestKey}_max_attempts`), 10) || 1,
              attempted: attemptsUsed > 0,
              completed: storedCompleted === 'true' || attemptsUsed > 0,
              assessmentSubmitted: localStorage.getItem(`${userTestKey}_assessment_submitted`) === 'true'
            };
            console.log(`Using stored status for test ${test._id}:`, statusObj[test._id]);
          }

          // Always fetch from server to ensure we have the latest data
          const response = await fetch(`${API_URL}/assessments/${assessmentId}/tests/${test._id}/attempts?email=${encodeURIComponent(userEmail)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'X-User-ID': userId // Add user ID to headers for additional verification
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`Server response for test ${test._id}:`, data);

            // Use server data as the source of truth
            const serverAttempts = data.attemptsUsed || 0;
            const isCompleted = serverAttempts > 0 || data.completed;

            statusObj[test._id] = {
              attemptsUsed: serverAttempts,
              maxAttempts: data.maxAttempts || 1,
              attempted: serverAttempts > 0,
              completed: isCompleted, // Mark as completed if attempted at least once
              assessmentSubmitted: data.assessmentSubmitted || false
            };
            console.log(`Updated status for test ${test._id} from server:`, statusObj[test._id]);

            // Store the updated data in localStorage with user-specific keys
            if (userId) {
              const userTestKey = `${userId}_${test._id}`;
              localStorage.setItem(`${userTestKey}_attempts`, serverAttempts);
              localStorage.setItem(`${userTestKey}_max_attempts`, data.maxAttempts || 1);
              localStorage.setItem(`${userTestKey}_completed`, isCompleted ? 'true' : 'false');
              localStorage.setItem(`${userTestKey}_assessment_submitted`, data.assessmentSubmitted ? 'true' : 'false');
              localStorage.setItem(`${userTestKey}_last_updated`, new Date().toISOString());
              localStorage.setItem(`${userTestKey}_status`, JSON.stringify({
                attemptsUsed: serverAttempts,
                maxAttempts: data.maxAttempts || 1,
                completed: isCompleted,
                assessmentSubmitted: data.assessmentSubmitted || false,
                lastUpdated: new Date().toISOString()
              }));
              console.log(`Stored test status in localStorage with key ${userTestKey}`);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server returned error:', response.status, errorData);
            toast.error(`Error fetching test status: ${errorData.message || response.statusText}`);
          }
        } catch (error) {
          console.error(`Error fetching status for test ${test._id}:`, error);
          statusObj[test._id] = { attemptsUsed: 0, maxAttempts: 1, attempted: false, completed: false };
        }
      }

      setTestStatus(statusObj);
    } catch (error) {
      console.error('Error fetching test status:', error);
      toast.error(`Error fetching test status: ${error.message}`);
    }
  }, [assessmentId, assessment, tests, toast]);

  // Effect to fetch test status when tests change
  useEffect(() => {
    if (tests.length > 0 && assessment) {
      fetchTestStatus();

      // Set up interval to periodically refresh the status
      const refreshInterval = setInterval(fetchTestStatus, 30000); // Refresh every 30 seconds

      // Also check for refresh triggers from other components
      const userId = localStorage.getItem('userId');
      if (userId) {
        const checkRefreshNeeded = () => {
          const refreshNeeded = localStorage.getItem(`${userId}_assessment_view_refresh_needed`);
          const assessmentRefreshNeeded = localStorage.getItem(`${userId}_assessment_${assessmentId}_refresh_needed`);

          if (refreshNeeded || assessmentRefreshNeeded) {
            console.log('Refresh trigger detected, updating test status');
            fetchTestStatus();

            // Clear the refresh flags after processing
            localStorage.removeItem(`${userId}_assessment_view_refresh_needed`);
            localStorage.removeItem(`${userId}_assessment_${assessmentId}_refresh_needed`);
          }
        };

        // Check for refresh triggers every 2 seconds
        const refreshCheckInterval = setInterval(checkRefreshNeeded, 2000);

        // Clean up intervals on unmount
        return () => {
          clearInterval(refreshInterval);
          clearInterval(refreshCheckInterval);
        };
      }

      // Clean up interval on unmount
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [tests, assessment, assessmentId, fetchTestStatus]);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching assessment with ID:', assessmentId);

        // Fetch the assessment data
        const assessmentData = await getAssessmentById(assessmentId);
        console.log('Assessment data received:', assessmentData);
        setAssessment(assessmentData);

        // Use testDetails from the response if available
        if (assessmentData.testDetails && Array.isArray(assessmentData.testDetails)) {
          console.log('Using test details from response');
          const validTests = assessmentData.testDetails.filter(test => test !== null);
          setTests(validTests);

          // Set the first test as selected by default if available
          if (validTests.length > 0) {
            const firstTest = validTests[0];
            const testId = firstTest._id || firstTest.id;
            console.log('Setting default selected test:', testId);
            setSelectedTestId(testId);
          }
        }
        // Otherwise, fetch tests individually
        else if (assessmentData.tests && Array.isArray(assessmentData.tests)) {
          console.log('Fetching individual tests');
          try {
            // Fetch tests one by one to handle permission errors gracefully
            const fetchedTests = [];
            for (const testId of assessmentData.tests) {
              try {
                console.log('Fetching test:', testId);
                const test = await getTestById(testId);
                if (test) {
                  console.log('Successfully fetched test:', testId);
                  fetchedTests.push(test);
                }
              } catch (testError) {
                console.warn(`Could not fetch test ${testId}:`, testError);
                // Continue with other tests even if one fails
              }
            }

            console.log('Successfully fetched tests:', fetchedTests.length);
            setTests(fetchedTests);

            // Set the first test as selected by default if available
            if (fetchedTests.length > 0) {
              // Use _id consistently
              const firstTest = fetchedTests[0];
              const testId = firstTest._id;
              console.log('Setting default selected test:', testId);
              setSelectedTestId(testId);
            }
          } catch (testsError) {
            console.error('Error fetching tests:', testsError);
            // Don't fail the whole operation if test fetching fails
          }
        } else {
          console.warn('No tests found in assessment data:', assessmentData);
        }

      } catch (error) {
        console.error('Error fetching assessment:', error);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  const handleTestChange = (event) => {
    setSelectedTestId(event.target.value);
  };

  const handleStartTest = () => {
    if (selectedTestId) {
      console.log('Starting test with ID:', selectedTestId, 'from assessment:', assessmentId);
      // Pass the assessmentId as a query parameter to ensure permissions work properly
      navigate(`/tests/${selectedTestId}?assessmentId=${assessmentId}`);
    }
  };

  const handleOpenConfirmDialog = async () => {
    // Refresh test status before showing the dialog to ensure we have the latest data
    await fetchTestStatus();

    // Check if all tests have been attempted using the latest data
    const completedTests = Object.values(testStatus).filter(status => status?.completed || status?.attemptsUsed > 0).length;
    const totalTests = tests.length;

    if (completedTests < totalTests) {
      // Show warning but still allow submission
      toast.warning(`You have only completed ${completedTests} out of ${totalTests} tests. Are you sure you want to submit?`);
    }

    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleSubmitAssessment = async () => {
    try {
      setSubmitting(true);
      setConfirmDialogOpen(false);

      // Get user ID for verification
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');

      if (!userId || !userEmail) {
        toast.error('User authentication error. Please log in again.');
        return;
      }

      console.log(`Submitting assessment ${assessmentId} for user ${userEmail} (${userId})`);

      // Refresh test status one more time before submission
      await fetchTestStatus();

      // Submit the entire assessment with user-specific data
      const result = await submitAssessment(assessmentId, { userId, userEmail });
      console.log('Assessment submission result:', result);

      setSubmitSuccess(true);
      toast.success('Assessment submitted successfully!');

      // Update localStorage to reflect submission
      if (userId) {
        // Mark all tests as submitted in localStorage
        for (const test of tests) {
          const userTestKey = `${userId}_${test._id}`;
          localStorage.setItem(`${userTestKey}_assessment_submitted`, 'true');
          localStorage.setItem(`${userTestKey}_last_updated`, new Date().toISOString());
        }

        // Mark the assessment as submitted
        localStorage.setItem(`${userId}_assessment_${assessmentId}_submitted`, 'true');
        localStorage.setItem(`${userId}_assessment_${assessmentId}_submitted_at`, new Date().toISOString());
      }

      // Refresh the assessment data to update the status
      console.log('Refreshing assessment data...');
      const updatedAssessment = await getAssessmentById(assessmentId);
      console.log('Updated assessment data:', updatedAssessment);
      setAssessment(updatedAssessment);

      // Refresh test status
      fetchTestStatus();

      // Force a refresh of the dashboard to show the submitted assessment in Past Tests
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error(`Error: ${error.message || 'Failed to submit assessment'}`);
    } finally {
      setSubmitting(false);
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

  const getTestById = (testId) => {
    return tests.find(test => test._id === testId) || null;
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This could be due to a permission issue or the assessment may not exist.
          If you believe you should have access to this assessment, please contact the administrator.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
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
    <Container maxWidth="lg" sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 4 : 8 }}>
      <Paper sx={{ p: responsivePadding, mb: isMobile ? 2 : 4, borderRadius: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
          {assessment.title}
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {assessment.description}
        </Typography>

        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 2 : 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Start: {new Date(assessment.startTime).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                End: {new Date(assessment.endTime).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CodeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                Tests: {tests.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: isMobile ? 2 : 3 }}>
          <Chip
            label={isAssessmentActive() ? "Active" : "Inactive"}
            color={isAssessmentActive() ? "success" : "error"}
          />

          {/* Progress indicator */}
          {tests.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {Object.values(testStatus).filter(status => status?.completed || status?.attemptsUsed > 0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">/</Typography>
                <Typography variant="body2" color="text.secondary">
                  {tests.length}
                </Typography>
              </Box>
              <Box sx={{ width: 100, ml: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={(Object.values(testStatus).filter(status => status?.completed || status?.attemptsUsed > 0).length / tests.length) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: isMobile ? 2 : 3 }} />

        {!isAssessmentActive() ? (
          <Alert severity="warning" sx={{ mb: isMobile ? 2 : 3 }}>
            This assessment is not currently active. You can only take tests during the scheduled time period.
          </Alert>
        ) : tests.length === 0 ? (
          <Alert severity="info" sx={{ mb: isMobile ? 2 : 3 }}>
            There are no tests available in this assessment.
          </Alert>
        ) : (
          <>
            <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
              Select a Test to Start
            </Typography>

            <FormControl fullWidth sx={{ mb: isMobile ? 2 : 3 }}>
              <InputLabel id="test-select-label">Select Test</InputLabel>
              <Select
                labelId="test-select-label"
                id="test-select"
                value={selectedTestId}
                label="Select Test"
                onChange={handleTestChange}
              >
                {tests.map((test) => {
                  console.log(`Test ${test._id} status:`, testStatus[test._id]);
                  const isAttempted = testStatus[test._id]?.attemptsUsed > 0;

                  return (
                    <MenuItem key={test._id} value={test._id}>
                      {test.title} ({test.difficulty} - {test.timeLimit} min)
                      {isAttempted && (
                        <Chip
                          label="Completed"
                          color="success"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              size={isMobile ? "medium" : "large"}
              onClick={handleStartTest}
              disabled={!selectedTestId || !isAssessmentActive()}
              fullWidth
              sx={{ py: isMobile ? 1 : 1.5 }}
            >
              Start Selected Test
            </Button>
          </>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
        >
          Back to Dashboard
        </Button>

        {isAssessmentActive() && tests.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            size={isMobile ? "small" : "medium"}
            onClick={handleOpenConfirmDialog}
            disabled={submitting || (assessment.userSubmissions &&
                      assessment.userSubmissions[localStorage.getItem('userId')] &&
                      assessment.userSubmissions[localStorage.getItem('userId')].submitted)}
            startIcon={<DoneAllIcon />}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        )}
      </Box>

      {submitSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Assessment submitted successfully! You can no longer make changes to your submissions.
        </Alert>
      )}

      {/* Check if the current user has submitted this assessment */}
      {assessment.userSubmissions &&
       assessment.userSubmissions[localStorage.getItem('userId')] &&
       assessment.userSubmissions[localStorage.getItem('userId')].submitted &&
       !submitSuccess && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You have already submitted this assessment. You can no longer make changes to your submissions.
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Submit Assessment?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to submit this assessment?
            {Object.values(testStatus).filter(status => status?.completed || status?.attemptsUsed > 0).length < tests.length && (
              <>
                <br /><br />
                <strong>Warning:</strong> You have only completed {Object.values(testStatus).filter(status => status?.completed || status?.attemptsUsed > 0).length} out of {tests.length} tests.
              </>
            )}
            <br /><br />
            Once submitted, you will not be able to make any further changes to your solutions.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmitAssessment} color="secondary" variant="contained" autoFocus>
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssessmentView;

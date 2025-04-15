import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getAssessmentById, getTestById, submitAssessment } from '../../utils/api';
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  ArrowBack as ArrowBackIcon
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
  const [selectedTestId, setSelectedTestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
              const firstTest = fetchedTests[0];
              const testId = firstTest._id || firstTest.id;
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

  const handleSubmitAssessment = async () => {
    try {
      setSubmitting(true);

      // Submit the entire assessment
      await submitAssessment(assessmentId);

      setSubmitSuccess(true);
      toast.success('Assessment submitted successfully!');

      // Refresh the assessment data to update the status
      const updatedAssessment = await getAssessmentById(assessmentId);
      setAssessment(updatedAssessment);
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
        <Typography variant="body2" color="text.secondary" paragraph>
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

        <Typography variant="body1" paragraph>
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

        <Chip
          label={isAssessmentActive() ? "Active" : "Inactive"}
          color={isAssessmentActive() ? "success" : "error"}
          sx={{ mb: isMobile ? 2 : 3 }}
        />

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
                {tests.map((test) => (
                  <MenuItem key={test._id} value={test._id}>
                    {test.title} ({test.difficulty} - {test.timeLimit} min)
                  </MenuItem>
                ))}
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
            onClick={handleSubmitAssessment}
            disabled={submitting || assessment.submitted}
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

      {assessment.submitted && !submitSuccess && (
        <Alert severity="info" sx={{ mt: 2 }}>
          This assessment has already been submitted. You can no longer make changes to your submissions.
        </Alert>
      )}
    </Container>
  );
};

export default AssessmentView;

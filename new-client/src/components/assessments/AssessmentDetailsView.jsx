import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAssessmentById, getTestById, fetchAPI, getAssessmentSubmissions } from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useIsMobile, useIsTablet, getResponsivePadding } from '../../utils/responsive';

const AssessmentDetailsView = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const responsivePadding = getResponsivePadding(isMobile, isTablet);

  const [assessment, setAssessment] = useState(null);
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching assessment with ID:', assessmentId);

        // Use direct API call to get more debugging information
        const response = await fetchAPI(`/assessments/${assessmentId}`);
        console.log('Assessment API response:', response);

        if (!response) {
          throw new Error('Failed to fetch assessment data');
        }

        setAssessment(response);

        // If user is an assessor and the creator of the assessment, fetch submissions
        if (user?.role === 'assessor') {
          console.log('User is assessor, checking if creator:', {
            createdBy: response.createdBy,
            userId: user?._id,
            isCreator: response.createdBy?.toString() === user?._id?.toString()
          });

          // Compare IDs as strings to handle ObjectId vs string comparison
          if (response.createdBy?.toString() === user?._id?.toString()) {
            console.log('User is the creator, fetching submissions');
            fetchSubmissions(assessmentId);
          }
        }

        // Use testDetails from the response if available
        if (response.testDetails && Array.isArray(response.testDetails)) {
          console.log('Using test details from response');
          setTests(response.testDetails);
        }
        // Otherwise, fetch tests individually
        else if (response.tests && Array.isArray(response.tests)) {
          console.log('Fetching individual tests');
          try {
            // Fetch tests one by one to handle permission errors gracefully
            const fetchedTests = [];
            for (const testId of response.tests) {
              try {
                const test = await getTestById(testId);
                if (test) fetchedTests.push(test);
              } catch (testError) {
                console.warn(`Could not fetch test ${testId}:`, testError);
                // Continue with other tests even if one fails
              }
            }
            console.log('Successfully fetched tests:', fetchedTests.length);
            setTests(fetchedTests);
          } catch (testsError) {
            console.error('Error fetching tests:', testsError);
            // Don't fail the whole operation if test fetching fails
          }
        }

      } catch (error) {
        console.error('Error fetching assessment:', error);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    } else {
      setError('Invalid assessment ID');
      setLoading(false);
    }
  }, [assessmentId, user?.role, user?._id]);

  // Function to fetch submissions for this assessment
  const fetchSubmissions = async (assessmentId) => {
    try {
      setLoadingSubmissions(true);
      console.log('Fetching submissions for assessment:', assessmentId);

      const submissionsData = await getAssessmentSubmissions(assessmentId);
      console.log('Submissions data received:', submissionsData);
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Don't set the main error state, just log it
    } finally {
      setLoadingSubmissions(false);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper sx={{ p: responsivePadding, mb: 4, borderRadius: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
          {assessment.title}
        </Typography>

        <Typography variant="body1" paragraph>
          {assessment.description}
        </Typography>

        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
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

          {assessment.maxAttempts && (
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  Max Attempts: {assessment.maxAttempts}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Chip
          label={isAssessmentActive() ? "Active" : "Inactive"}
          color={isAssessmentActive() ? "success" : "error"}
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Included Tests
        </Typography>

        {tests.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            There are no tests available in this assessment.
          </Alert>
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {tests.map((test) => (
              <Grid item xs={12} sm={6} md={4} key={test._id || test.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {test.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {test.description || 'No description provided'}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                        icon={<AccessTimeIcon fontSize="small" />}
                      />
                    </Box>
                  </CardContent>

                  {user?.role === 'assessor' ? (
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/tests/${test._id || test.id}`}
                        onClick={() => console.log('Navigating to test:', test._id || test.id)}
                      >
                        View Test
                      </Button>
                    </CardActions>
                  ) : (
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        component={RouterLink}
                        to={`/tests/${test._id || test.id}?assessmentId=${assessmentId}`}
                        onClick={() => console.log('Starting test:', test._id || test.id, 'from assessment:', assessmentId)}
                        disabled={!isAssessmentActive()}
                        fullWidth
                      >
                        {isAssessmentActive() ? 'Start Test' : 'Test Unavailable'}
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Submissions Section - Only visible to assessors who created the assessment */}
      {user?.role === 'assessor' && assessment?.createdBy?.toString() === user?._id?.toString() && (
        <Paper sx={{ p: responsivePadding, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Submissions
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loadingSubmissions && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!loadingSubmissions && submissions.length === 0 && (
            <Alert severity="info">
              No submissions yet.
            </Alert>
          )}

          {!loadingSubmissions && submissions.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>{submission.user?.email || 'Unknown'}</TableCell>
                      <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={submission.status}
                          size="small"
                          color={
                            submission.status === 'completed' ? 'success' :
                            submission.status === 'failed' ? 'error' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {submission.testCasesPassed}/{submission.totalTestCases} ({submission.percentageScore || Math.round((submission.testCasesPassed / submission.totalTestCases) * 100)}%)
                        {submission.attemptedTests && submission.totalTests && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {submission.attemptedTests}/{submission.totalTests} problems attempted
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          component={RouterLink}
                          to={`/assessments/submissions/${submission._id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      )}

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
};

export default AssessmentDetailsView;

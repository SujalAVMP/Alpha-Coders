import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { getAllTests, getAssessmentById, deleteAssessment, getAssessmentSubmissions } from '../../utils/api';

const AssessmentDetails = () => {
  const { assessmentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Function to fetch submissions for this assessment
  const fetchSubmissions = async (id) => {
    try {
      setLoadingSubmissions(true);
      console.log('Fetching submissions for assessment:', id);
      const userEmail = sessionStorage.getItem('userEmail') || '';
      const response = await fetch(`http://localhost:5002/api/assessments/${id}/submissions?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Submissions data received:', data);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // Don't set the main error state, just log it
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch available tests
        const testsData = await getAllTests();
        setTests(testsData || []);

        // Fetch the assessment data
        try {
          console.log('Fetching assessment with ID:', assessmentId);
          const assessmentData = await getAssessmentById(assessmentId);
          console.log('Assessment data received:', assessmentData);

          // Process invitedUsers data for display
          if (assessmentData && assessmentData.invitedUsers) {
            console.log('Processing invitedUsers:', assessmentData.invitedUsers);

            // Ensure invitedUsers is properly formatted for display
            assessmentData.processedInvitedUsers = assessmentData.invitedUsers.map(user => {
              // If user is an object with email property, it's an unregistered user
              if (typeof user === 'object' && user.email) {
                return {
                  email: user.email,
                  status: user.status || 'Invited'
                };
              }
              // If user is an object with _id property, it's a registered user
              else if (typeof user === 'object' && (user._id || user.id)) {
                return {
                  id: user._id || user.id,
                  email: user.email || 'Unknown',
                  status: user.status || 'Invited'
                };
              }
              // If user is a string, it might be just an email or an ID
              else if (typeof user === 'string') {
                return {
                  id: user,
                  email: user.includes('@') ? user : 'Unknown ID: ' + user,
                  status: 'Invited'
                };
              }
              // Default case
              return {
                email: 'Unknown',
                status: 'Invited'
              };
            });

            console.log('Processed invitedUsers:', assessmentData.processedInvitedUsers);
          }

          setAssessment(assessmentData);

          // If user is an assessor, fetch submissions for this assessment
          if (user?.role === 'assessor') {
            console.log('User is assessor, fetching submissions');
            fetchSubmissions(assessmentId);
          }
        } catch (error) {
          console.error('Error fetching assessment:', error);
          setError('Failed to load assessment data. Please try again.');
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load assessment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId) {
      fetchData();
    } else {
      setError('Invalid assessment ID');
      setLoading(false);
    }
  }, [assessmentId, user?.id, user?.role]);

  const handleDeleteAssessment = async () => {
    try {
      setLoading(true);
      const response = await deleteAssessment(assessmentId);
      console.log('Assessment deleted successfully:', response);
      // Close the dialog and navigate back to assessments list
      setOpenDeleteDialog(false);
      navigate('/assessments');
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      setError(`Failed to delete assessment: ${err.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  const getTestById = (testId) => {
    return tests.find(test => test._id === testId) || null;
  };

  const isAssessor = user?.role === 'assessor';
  const isCreator = assessment?.createdBy?.toString() === user?._id?.toString();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          Assessment not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          underline="hover"
        >
          Dashboard
        </Link>
        <Typography color="text.primary">
          Assessment Details
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {assessment.title}
        </Typography>

        {isAssessor && isCreator && (
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={Link}
              to={`/assessments/${assessmentId}/edit`}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Assessment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="body1" paragraph>
              {assessment.description || 'No description provided.'}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                  Start: {new Date(assessment.startTime).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                  End: {new Date(assessment.endTime).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                  Max Attempts: {assessment.maxAttempts}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                  Tests: {assessment.tests.length}
                </Typography>
              </Grid>
            </Grid>

            <Chip
              label={assessment.isPublic ? 'Public Assessment' : 'Private Assessment'}
              color={assessment.isPublic ? 'success' : 'default'}
              variant="outlined"
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Included Tests
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {assessment.tests.length === 0 ? (
              <Alert severity="info">
                No tests included in this assessment.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {assessment.tests.map((testId) => {
                  const test = getTestById(testId);
                  if (!test) return null;

                  return (
                    <Grid item xs={12} sm={6} key={testId}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {test.title}
                          </Typography>

                          <Typography variant="body2" color="textSecondary" paragraph>
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
                              icon={<AccessTimeIcon />}
                            />
                          </Box>
                        </CardContent>

                        {!isAssessor && (
                          <CardActions>
                            <Button
                              size="small"
                              component={Link}
                              to={`/tests/${testId}`}
                              variant="contained"
                              fullWidth
                            >
                              Start Test
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {isAssessor && isCreator && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Invited Students
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {(!assessment.processedInvitedUsers || assessment.processedInvitedUsers.length === 0) ? (
                  <Alert severity="info">
                    No students have been invited yet.
                  </Alert>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assessment.processedInvitedUsers.map((student, index) => (
                            <TableRow key={student.id || student.email || index}>
                              <TableCell>{student.email || 'Unknown'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={student.status || 'Invited'}
                                  size="small"
                                  color={
                                    student.status === 'Invited' ? 'primary' :
                                    student.status === 'Started' ? 'warning' :
                                    student.status === 'Completed' ? 'success' : 'default'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Button
                      variant="outlined"
                      startIcon={<EmailIcon />}
                      fullWidth
                      sx={{ mt: 2 }}
                      component={Link}
                      to={`/assessments/${assessmentId}/edit`}
                    >
                      Invite More Students
                    </Button>
                  </>
                )}
              </Paper>

              <Paper sx={{ p: 3 }}>
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
                  <TableContainer>
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
                              {submission.testCasesPassed}/{submission.totalTestCases} ({submission.percentageScore}%)
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                component={Link}
                                to={`/assessments/submissions/${submission._id}`}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </>
          )}

          {!isAssessor && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Assessment Status
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" paragraph>
                  You have been invited to take this assessment.
                </Typography>

                <Typography variant="body2" paragraph>
                  Time Remaining: {Math.ceil((new Date(assessment.endTime) - new Date()) / (1000 * 60 * 60 * 24))} days
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Start Assessment
                </Button>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this assessment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAssessment} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentDetails;

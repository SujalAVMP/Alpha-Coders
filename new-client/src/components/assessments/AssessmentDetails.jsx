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
import { getAllTests, getAssessmentById } from '../../utils/api';

const AssessmentDetails = () => {
  const { assessmentId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [tests, setTests] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

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
          setAssessment(assessmentData);
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
  }, [assessmentId, user?.id]);

  const handleDeleteAssessment = () => {
    // In a real app, we would delete the assessment here
    console.log('Deleting assessment:', assessmentId);

    // Navigate back to dashboard
    navigate('/dashboard');
  };

  const getTestById = (testId) => {
    return tests.find(test => test._id === testId) || null;
  };

  const isAssessor = user?.role === 'assessor';
  const isCreator = assessment?.createdBy === user?.id;

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

                {(assessment.invitedUsers || []).length === 0 ? (
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
                          {(assessment.invitedUsers || []).map((student) => (
                            <TableRow key={student.id || student.email}>
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

                {assessment.submissions.length === 0 ? (
                  <Alert severity="info">
                    No submissions yet.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Student</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Score</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assessment.submissions.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>{submission.studentEmail}</TableCell>
                            <TableCell>
                              <Chip
                                label={submission.status}
                                size="small"
                                color={
                                  submission.status === 'In Progress' ? 'warning' :
                                  submission.status === 'Completed' ? 'success' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {submission.score}/{submission.totalTests}
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

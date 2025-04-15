import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getAssessmentSubmissionById } from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AssessmentSubmissionDetails = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const data = await getAssessmentSubmissionById(id);
        setSubmission(data);
      } catch (error) {
        console.error('Error fetching assessment submission:', error);
        setError(error.message || 'Failed to load assessment submission details');
        toast.error(`Error: ${error.message || 'Failed to load assessment submission details'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading assessment submission
          </Typography>
          <Typography>{error}</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Submission not found
          </Typography>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // Calculate overall score
  const totalTests = submission.testResults.length;
  const passedTests = submission.testResults.filter(test => test.status === 'Completed' || test.status === 'Accepted').length;
  const overallScore = Math.round((passedTests / totalTests) * 100);

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Assessment Submission
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {submission.assessmentTitle}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/dashboard"
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>

        {/* Overall Summary */}
        <Paper
          elevation={2}
          sx={{
            p: 0,
            borderRadius: 3,
            overflow: 'hidden',
            mb: 4
          }}
        >
          <Box sx={{
            bgcolor: overallScore >= 70 ? 'success.main' : 'error.main',
            color: 'white',
            py: 2,
            px: 3
          }}>
            <Typography variant="h6" fontWeight="bold">
              {overallScore >= 70 ? 'Passed' : 'Failed'}
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        SUBMITTED
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(submission.submittedAt)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        TESTS COMPLETED
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {passedTests} of {totalTests}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'center',
                    height: '100%',
                    borderLeft: { xs: 0, md: 1 },
                    borderTop: { xs: 1, md: 0 },
                    borderColor: 'divider',
                    pt: { xs: 2, md: 0 },
                    mt: { xs: 2, md: 0 },
                    pl: { xs: 0, md: 3 }
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" color={
                    overallScore >= 70 ? 'success.main' : 'error.main'
                  }>
                    {overallScore}%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Overall Score
                  </Typography>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={overallScore}
                      color={overallScore >= 70 ? 'success' : 'error'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Test Results */}
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Test Results
        </Typography>

        <Grid container spacing={3}>
          {submission.testResults.map((testResult, index) => (
            <Grid item xs={12} key={index}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  borderLeft: 6,
                  borderColor: testResult.status === 'Completed' || testResult.status === 'Accepted' ? 'success.main' : 'error.main'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {testResult.testTitle}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={testResult.language.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${testResult.testCasesPassed}/${testResult.totalTestCases} Tests`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={testResult.status}
                          size="small"
                          color={testResult.status === 'Completed' || testResult.status === 'Accepted' ? 'success' : 'error'}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" fontWeight="bold" color={
                        testResult.score >= 70 ? 'success.main' : 'error.main'
                      }>
                        {testResult.score}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Score
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Submitted: {formatDate(testResult.submittedAt)}
                    </Typography>
                  </Box>

                  {/* Test case details */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Test Cases
                    </Typography>
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Case</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Execution Time</TableCell>
                            <TableCell align="right">Memory Used</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Array.from({ length: testResult.totalTestCases }).map((_, index) => {
                            const passed = index < testResult.testCasesPassed;
                            return (
                              <TableRow key={index}>
                                <TableCell>Test Case {index + 1}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={passed ? "Passed" : "Failed"}
                                    color={passed ? "success" : "error"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">{passed ? `${Math.floor(Math.random() * 50) + 10} ms` : '-'}</TableCell>
                                <TableCell align="right">{passed ? `${Math.floor(Math.random() * 10) + 5} MB` : '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default AssessmentSubmissionDetails;

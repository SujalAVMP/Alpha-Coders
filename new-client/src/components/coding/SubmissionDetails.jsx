import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getSubmissionById } from '../../utils/api';
import Editor from '@monaco-editor/react';
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
  TableRow
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Helper function to convert API language names to Monaco editor language identifiers
const getMonacoLanguage = (language) => {
  const languageMap = {
    'python': 'python',
    'cpp': 'cpp',
    'c++': 'cpp'
  };

  return languageMap[language?.toLowerCase()] || 'python';
};

const SubmissionDetails = () => {
  const { id: _id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const data = await getSubmissionById(_id);
        setSubmission(data);
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [_id]);

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
            Error loading submission
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

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Submission Details
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {submission.test.title}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/tests/${submission.test._id}`}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: 2 }}
          >
            Back to Problem
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Submission Info */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 0,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box sx={{
                bgcolor: submission.status === 'Accepted' ? 'success.main' :
                         submission.status === 'Wrong Answer' ? 'error.main' : 'warning.main',
                color: 'white',
                py: 2,
                px: 3
              }}>
                <Typography variant="h6" fontWeight="bold">
                  {submission.status}
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
                            LANGUAGE
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {submission.language}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            EXECUTION TIME
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {submission.executionTime} ms
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            MEMORY USED
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {submission.memoryUsed} MB
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
                        submission.status === 'Accepted' ? 'success.main' :
                        submission.status === 'Wrong Answer' ? 'error.main' : 'warning.main'
                      }>
                        {submission.testCasesPassed}/{submission.totalTestCases}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Test Cases Passed
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Code */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Your Code
                </Typography>
                <Chip
                  label={submission.language}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Box>

              <Box>
                <Editor
                  height="450px"
                  language={getMonacoLanguage(submission.language)}
                  value={submission.code}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    lineHeight: 1.5
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Test Results */}
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                px: 3
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Test Results
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                {submission.testResults && submission.testResults.length > 0 ? (
                  <Grid container spacing={3}>
                    {submission.testResults.map((result, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: result.passed ? 'success.50' : 'error.50',
                            borderLeft: 4,
                            borderColor: result.passed ? 'success.main' : 'error.main'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: result.passed ? 0 : 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Test Case {index + 1}:
                            </Typography>
                            <Chip
                              label={result.passed ? 'Passed' : 'Failed'}
                              color={result.passed ? 'success' : 'error'}
                              size="small"
                              sx={{ ml: 2, fontWeight: 600 }}
                            />
                          </Box>

                          {!result.passed && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                  Input:
                                </Typography>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    mt: 1,
                                    bgcolor: 'background.paper',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    maxHeight: '100px',
                                    overflow: 'auto'
                                  }}
                                >
                                  {result.input}
                                </Paper>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                  Expected Output:
                                </Typography>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    mt: 1,
                                    bgcolor: 'background.paper',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    maxHeight: '100px',
                                    overflow: 'auto'
                                  }}
                                >
                                  {result.expected}
                                </Paper>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" fontWeight="bold" color="text.secondary">
                                  Your Output:
                                </Typography>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 1.5,
                                    mt: 1,
                                    bgcolor: 'background.paper',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    maxHeight: '100px',
                                    overflow: 'auto'
                                  }}
                                >
                                  {result.actual}
                                </Paper>
                              </Grid>
                            </Grid>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '200px',
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No detailed test results available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This submission doesn't have detailed test results.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SubmissionDetails;

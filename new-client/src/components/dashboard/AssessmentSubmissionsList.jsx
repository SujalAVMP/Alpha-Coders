import React, { useState, useEffect } from 'react';
import { getUserAssessmentSubmissions } from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CodeIcon from '@mui/icons-material/Code';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link as RouterLink } from 'react-router-dom';

const AssessmentSubmissionsList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await getUserAssessmentSubmissions();
        setAssessments(data);
      } catch (error) {
        console.error('Error fetching assessment submissions:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatMetric = (value, unit = '') => {
    if (value === null || value === undefined || value === 0) return 'N/A';
    return `${value}${unit}`;
  };

  // Helper: Get the latest submission for a test by the current user
  const getLatestSubmissionForTest = (test) => {
    if (!test.submissions || test.submissions.length === 0) return null;
    return test.submissions.reduce((latest, sub) =>
      !latest || new Date(sub.submittedAt) > new Date(latest.submittedAt) ? sub : latest
    , null);
  };

  // Helper: Calculate score for the current user
  const calculateAssessmentScore = (assessment) => {
    if (!assessment.tests || assessment.tests.length === 0) return 0;

    const attemptedTests = assessment.tests.filter(test => {
      const submission = getLatestSubmissionForTest(test);
      return submission && submission.status !== 'Not Attempted';
    });
    if (attemptedTests.length === 0) return 0;

    const totalScore = attemptedTests.reduce((sum, test) => {
      const submission = getLatestSubmissionForTest(test);
      if (submission && submission.totalTestCases > 0) {
        return sum + ((submission.testCasesPassed / submission.totalTestCases) * 100);
      }
      return sum;
    }, 0);

    return Math.round(totalScore / attemptedTests.length);
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
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading assessment submissions: {error}
      </Alert>
    );
  }

  if (assessments.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        You haven't submitted any assessments yet.
      </Alert>
    );
  }

  return (
    <Box>
      {assessments.map((assessment) => (
        <Card
          key={assessment.id}
          sx={{
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <Accordion
            expanded={expandedPanel === assessment.id}
            onChange={handlePanelChange(assessment.id)}
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              '& .MuiAccordionSummary-root': { p: 0 }
            }}
          >
            <AccordionSummary
              expandIcon={
                <Box sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  p: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ExpandMoreIcon fontSize="small" />
                </Box>
              }
              aria-controls={`panel-${assessment.id}-content`}
              id={`panel-${assessment.id}-header`}
              sx={{ p: 0 }}
            >
              <CardContent sx={{ width: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {assessment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      From: 111
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={`${assessment.tests.length} Tests`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={assessment.isSubmitted ? 'Submitted' : 'In Progress'}
                        color={assessment.isSubmitted ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Submitted: {formatDate(assessment.submittedAt)}
                    </Typography>

                    {assessment.tests.length > 0 && getLatestSubmissionForTest(assessment.tests[0]) && getLatestSubmissionForTest(assessment.tests[0]).language && (
                      <Chip
                        label={getLatestSubmissionForTest(assessment.tests[0]).language.toUpperCase()}
                        size="small"
                        color="primary"
                        sx={{ mb: 1 }}
                      />
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {
                          assessment.tests.filter(test => {
                            const submission = getLatestSubmissionForTest(test);
                            return submission && submission.status !== 'Not Attempted';
                          }).length
                        }/{assessment.tests.length} Tests
                      </Typography>
                      <Typography variant="body2">
                        Score: {calculateAssessmentScore(assessment)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0, pt: 0, pb: 2 }}>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ px: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
                  Test Submissions
                </Typography>

                {assessment.tests.length === 0 ? (
                  <Alert severity="info">No test submissions found for this assessment.</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {assessment.tests.map((test) => {
                      const submission = getLatestSubmissionForTest(test);
                      return (
                        <Card
                          key={test.id}
                          variant="outlined"
                          sx={{
                            borderRadius: 1,
                            boxShadow: 'none'
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
                                  {test.title}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                  <Chip
                                    label={submission ? submission.language : 'N/A'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={submission ? submission.status : 'Not Attempted'}
                                    size="small"
                                    color={
                                      submission
                                        ? submission.status === 'Accepted'
                                          ? 'success'
                                          : submission.status === 'Wrong Answer'
                                          ? 'error'
                                          : submission.status === 'Not Attempted'
                                          ? 'default'
                                          : 'warning'
                                        : 'default'
                                    }
                                  />
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Tests: {submission && submission.status !== 'Not Attempted'
                                      ? `${submission.testCasesPassed}/${submission.totalTestCases}`
                                      : 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Time: {submission ? formatMetric(submission.executionTime, ' ms') : 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Memory: {submission ? formatMetric(submission.memoryUsed, ' MB') : 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'right' }}>
                                  Submitted: {submission ? formatDate(submission.submittedAt) : 'N/A'}
                                </Typography>

                                {submission && submission.submissionId ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    component={RouterLink}
                                    to={`/submissions/${submission.submissionId}`}
                                    sx={{ minWidth: '120px' }}
                                  >
                                    View Details
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    disabled
                                    sx={{ minWidth: '120px' }}
                                  >
                                    Not Attempted
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Card>
      ))}
    </Box>
  );
};

export default AssessmentSubmissionsList;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubmissionById } from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import Editor from '@monaco-editor/react';

const SubmissionDetails = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await getSubmissionById(id);
        setSubmission(res.data);
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError('Failed to load submission. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Wrong Answer':
        return 'error';
      case 'Time Limit Exceeded':
        return 'warning';
      case 'Memory Limit Exceeded':
        return 'warning';
      case 'Runtime Error':
        return 'error';
      case 'Compilation Error':
        return 'error';
      case 'Pending':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Submission Details
        </Typography>
        <Button
          component={Link}
          to="/submissions"
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Back to Submissions
        </Button>
        <Button
          component={Link}
          to={`/tests/${submission.test._id}`}
          variant="contained"
        >
          Attempt Again
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{submission.test.title}</Typography>
              <Chip
                label={submission.status}
                color={getStatusColor(submission.status)}
              />
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Language
                </Typography>
                <Typography variant="body1">
                  {submission.language}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Test Cases Passed
                </Typography>
                <Typography variant="body1">
                  {submission.testCasesPassed}/{submission.totalTestCases}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Execution Time
                </Typography>
                <Typography variant="body1">
                  {submission.executionTime} ms
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Memory Used
                </Typography>
                <Typography variant="body1">
                  {submission.memoryUsed} MB
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Submitted At
                </Typography>
                <Typography variant="body1">
                  {new Date(submission.submittedAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Code
            </Typography>
            <Box sx={{ height: '400px', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={submission.language}
                value={submission.code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubmissionDetails;

import React from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import AssessmentSubmissionsList from './AssessmentSubmissionsList';

const SubmissionsList = () => {
  return (
    <Box className="page-container submissions-container">
      <Typography variant="h4" gutterBottom>
        Your Submissions
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} className="content-card">
        <AssessmentSubmissionsList />
      </Paper>
    </Box>
  );
};

export default SubmissionsList;

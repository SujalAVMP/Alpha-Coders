import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip
} from '@mui/material';

const ProblemStatement = ({ test }) => {
  if (!test) {
    return null;
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{test.title}</Typography>
        <Chip
          label={test.difficulty}
          color={getDifficultyColor(test.difficulty)}
          size="small"
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {test.description}
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Problem Statement
      </Typography>
      <Typography variant="body2" paragraph>
        {test.problemStatement}
      </Typography>
      
      {test.inputFormat && (
        <>
          <Typography variant="h6" gutterBottom>
            Input Format
          </Typography>
          <Typography variant="body2" paragraph>
            {test.inputFormat}
          </Typography>
        </>
      )}
      
      {test.outputFormat && (
        <>
          <Typography variant="h6" gutterBottom>
            Output Format
          </Typography>
          <Typography variant="body2" paragraph>
            {test.outputFormat}
          </Typography>
        </>
      )}
      
      {test.constraints && (
        <>
          <Typography variant="h6" gutterBottom>
            Constraints
          </Typography>
          <Typography variant="body2" paragraph>
            {test.constraints}
          </Typography>
        </>
      )}
      
      {test.sampleInput && test.sampleOutput && (
        <>
          <Typography variant="h6" gutterBottom>
            Sample
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Input
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, backgroundColor: '#f5f5f5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
              >
                {test.sampleInput}
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Output
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, backgroundColor: '#f5f5f5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
              >
                {test.sampleOutput}
              </Paper>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ProblemStatement;

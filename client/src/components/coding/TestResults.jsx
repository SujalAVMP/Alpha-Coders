import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { CheckCircle, Cancel, Timer, Memory } from '@mui/icons-material';

const TestResults = ({ results }) => {
  if (!results) {
    return null;
  }

  const { summary, results: testCases } = results;

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          label={summary.status}
          color={summary.status === 'Accepted' ? 'success' : 'error'}
        />
        <Typography variant="body2">
          {summary.passedTestCases}/{summary.totalTestCases} test cases passed
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List sx={{ width: '100%' }}>
        {testCases.map((testCase, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{ mb: 1, overflow: 'hidden' }}
          >
            <ListItem>
              <ListItemIcon>
                {testCase.passed ? (
                  <CheckCircle color="success" />
                ) : (
                  <Cancel color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={`Test Case ${testCase.testCaseNumber}`}
                secondary={
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Timer fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {testCase.executionTime} ms
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Memory fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {testCase.memoryUsed} MB
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            
            <Divider />
            
            <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5' }}>
              <Typography variant="caption" display="block" gutterBottom>
                Input:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mb: 1 }}
              >
                {testCase.input}
              </Typography>
              
              <Typography variant="caption" display="block" gutterBottom>
                Expected Output:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mb: 1 }}
              >
                {testCase.expectedOutput}
              </Typography>
              
              {!testCase.passed && (
                <>
                  <Typography variant="caption" display="block" gutterBottom>
                    Your Output:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
                  >
                    {testCase.actualOutput}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default TestResults;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById, executeCode, runTestCases, submitCode } from '../../utils/api';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import CodeEditor from './CodeEditor';
import ProblemStatement from './ProblemStatement';
import TestResults from './TestResults';

const TestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [tabValue, setTabValue] = useState(0);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [submitDialog, setSubmitDialog] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Default code templates for different languages
  const defaultCode = {
    javascript: `function solution(input) {\n  // Your code here\n  return input;\n}\n\n// Example usage\nconst input = "Hello, World!";\nconst output = solution(input);\nconsole.log(output);`,
    python: `def solution(input):\n    # Your code here\n    return input\n\n# Example usage\ninput_data = "Hello, World!"\noutput = solution(input_data)\nprint(output)`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String input = scanner.nextLine();\n        String output = solution(input);\n        System.out.println(output);\n    }\n    \n    public static String solution(String input) {\n        // Your code here\n        return input;\n    }\n}`,
    cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nstring solution(string input) {\n    // Your code here\n    return input;\n}\n\nint main() {\n    string input;\n    getline(cin, input);\n    string output = solution(input);\n    cout << output << endl;\n    return 0;\n}`
  };

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await getTestById(id);
        setTest(res.data);
      } catch (error) {
        console.error('Error fetching test:', error);
        setError('Failed to load test. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleRun = async (code) => {
    try {
      setExecuting(true);
      setError(null);
      
      // Use sample input from test
      const input = test.sampleInput || '';
      
      const res = await executeCode({ code, language, input });
      setOutput(res.data.output);
      setTabValue(1); // Switch to output tab
      
      setSnackbar({
        open: true,
        message: 'Code executed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error executing code:', error);
      setError('Failed to execute code. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to execute code',
        severity: 'error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleRunTests = async (code) => {
    try {
      setExecuting(true);
      setError(null);
      
      const res = await runTestCases(id, { code, language });
      setTestResults(res.data);
      setTabValue(2); // Switch to test results tab
      
      setSnackbar({
        open: true,
        message: `Test cases completed: ${res.data.summary.passedTestCases}/${res.data.summary.totalTestCases} passed`,
        severity: res.data.summary.passedTestCases === res.data.summary.totalTestCases ? 'success' : 'warning'
      });
    } catch (error) {
      console.error('Error running test cases:', error);
      setError('Failed to run test cases. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to run test cases',
        severity: 'error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = (code) => {
    setSubmitDialog(true);
  };

  const confirmSubmit = async (code) => {
    try {
      setExecuting(true);
      setError(null);
      setSubmitDialog(false);
      
      const res = await submitCode(id, { code, language });
      
      setSnackbar({
        open: true,
        message: 'Solution submitted successfully',
        severity: 'success'
      });
      
      setSubmissionSuccess(true);
      
      // Navigate to submission details after a short delay
      setTimeout(() => {
        navigate(`/submissions/${res.data._id}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting code:', error);
      setError('Failed to submit code. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to submit code',
        severity: 'error'
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  if (error && !test) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {submissionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your solution has been submitted successfully! Redirecting to submission details...
        </Alert>
      )}
      
      <Grid container spacing={2} sx={{ height: 'calc(100vh - 150px)' }}>
        {/* Problem Statement */}
        <Grid item xs={12} md={5} sx={{ height: '100%' }}>
          <ProblemStatement test={test} />
        </Grid>
        
        {/* Code Editor and Output */}
        <Grid item xs={12} md={7} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1 }}>
            <CodeEditor
              initialCode={defaultCode[language]}
              language={language}
              onLanguageChange={handleLanguageChange}
              onRun={handleRun}
              onSubmit={handleSubmit}
              loading={executing}
            />
          </Box>
          
          <Paper sx={{ mt: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Instructions" />
              <Tab label="Output" />
              <Tab label="Test Results" />
            </Tabs>
            
            <Box sx={{ p: 2, minHeight: '150px', maxHeight: '200px', overflow: 'auto' }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <Typography variant="body2">
                    1. Write your solution in the editor.
                  </Typography>
                  <Typography variant="body2">
                    2. Click "Run" to execute your code with the sample input.
                  </Typography>
                  <Typography variant="body2">
                    3. Use "Submit" when you're ready to submit your final solution.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleRunTests(defaultCode[language])}
                      disabled={executing}
                    >
                      Run Test Cases
                    </Button>
                  </Box>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Output
                  </Typography>
                  {output ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        backgroundColor: '#f5f5f5',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto'
                      }}
                    >
                      {output}
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Run your code to see the output here.
                    </Typography>
                  )}
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Test Results
                  </Typography>
                  {testResults ? (
                    <TestResults results={testResults} />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Run test cases to see the results here.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Confirmation Dialog for Submission */}
      <Dialog
        open={submitDialog}
        onClose={() => setSubmitDialog(false)}
      >
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your solution? Once submitted, you cannot edit it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={() => confirmSubmit(defaultCode[language])}
            color="primary"
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestPage;

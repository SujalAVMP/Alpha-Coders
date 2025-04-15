import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { executeCode, runTestCases, submitCode, fetchAPI } from '../../utils/api';
import Editor from '@monaco-editor/react';
import './TestPage.css';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';

// Helper function to convert API language names to Monaco editor language identifiers
const getMonacoLanguage = (language) => {
  const languageMap = {
    'python': 'python',
    'cpp': 'cpp',
    'c++': 'cpp'
  };

  return languageMap[language?.toLowerCase()] || 'python';
};

const TestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // Extract assessmentId from URL query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const assessmentId = queryParams.get('assessmentId');

  // State variables
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [tab, setTab] = useState(0);
  const [output, setOutput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);

  // Fetch attempts information and assessment status when the component loads
  useEffect(() => {
    if (assessmentId && id) {
      // Fetch attempts information from the server
      const fetchAttempts = async () => {
        try {
          const response = await fetch(`http://localhost:5002/api/assessments/${assessmentId}/tests/${id}/attempts?email=${encodeURIComponent(localStorage.getItem('userEmail'))}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Attempts data:', data);
            setAttemptsUsed(data.attemptsUsed || 0);
            setMaxAttempts(data.maxAttempts || 1);
            setAssessmentSubmitted(data.assessmentSubmitted || false);

            if (data.assessmentSubmitted) {
              toast.info('This assessment has been submitted. You cannot make further submissions.');
            }
          }
        } catch (error) {
          console.error('Error fetching attempts:', error);
        }
      };

      fetchAttempts();
    }
  }, [assessmentId, id]);

  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50); // 50% width for each panel
  const resizerRef = useRef(null);

  // Standard templates for all problems
  const standardTemplates = {
    python: `# Read input from stdin and solve the problem
# Example:
# n = int(input())
# arr = list(map(int, input().split()))

def solve():
    # Your solution here
    pass

if __name__ == "__main__":
    # Call the solve function
    solve()`,

    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Main solution function
void solve() {
    // Your solution here
    // Example:
    // int n;
    // cin >> n;
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) {
    //     cin >> arr[i];
    // }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Call the solve function
    solve();

    return 0;
}`
  };

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct the URL with the assessmentId as a query parameter if available
        let url = `/tests/${id}`;
        if (assessmentId) {
          url += `?assessmentId=${assessmentId}`;
        }

        // Add a retry mechanism for better reliability
        let attempts = 0;
        const maxAttempts = 3;
        let data = null;

        while (attempts < maxAttempts && !data) {
          try {
            attempts++;
            // Use the fetchAPI function directly to have more control over the URL
            data = await fetchAPI(url);

            if (!data) {
              throw new Error('Test not found or you do not have permission to access it');
            }
          } catch (fetchError) {
            console.error(`Attempt ${attempts} failed:`, fetchError);

            if (attempts >= maxAttempts) {
              throw fetchError; // Re-throw the error after max attempts
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        console.log('Fetched test data:', data);
        setTest(data);

        // Use custom boilerplate if available and enabled, otherwise use standard templates
        if (data.useCustomBoilerplate && data.customBoilerplate && data.customBoilerplate[language]) {
          console.log(`Using custom boilerplate for ${language}:`, data.customBoilerplate[language]);
          setCode(data.customBoilerplate[language]);
        } else {
          console.log(`Using standard template for ${language}:`, standardTemplates[language]);
          setCode(standardTemplates[language]);
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        // Provide a more user-friendly error message
        if (error.message.includes('permission')) {
          setError('You do not have permission to access this test. Please make sure you have been invited to take this test.');
        } else if (error.message.includes('not found')) {
          setError('Test not found. The test may have been removed or you may have an incorrect link.');
        } else if (error.message.includes('500')) {
          setError('The server encountered an error while loading the test. This might be due to a permission issue or a server configuration problem. Please contact your administrator.');
        } else {
          setError(`Error loading test: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id, assessmentId, language]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    console.log('Language changed to:', newLanguage);

    // Use custom boilerplate if available and enabled, otherwise use standard templates
    if (test && test.useCustomBoilerplate && test.customBoilerplate && test.customBoilerplate[newLanguage]) {
      console.log(`Using custom boilerplate for ${newLanguage}:`, test.customBoilerplate[newLanguage]);
      setCode(test.customBoilerplate[newLanguage]);
    } else {
      console.log(`Using standard template for ${newLanguage}:`, standardTemplates[newLanguage]);
      setCode(standardTemplates[newLanguage]);
    }
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleTabChange = (_, newValue) => {
    setTab(newValue);
  };

  // Function to handle editor mounting
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Handle resizer drag
  const handleMouseDown = useCallback((e) => {
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent) => {
      const containerWidth = document.querySelector('.test-page-container').clientWidth;
      const newWidth = startWidth + ((moveEvent.clientX - startX) / containerWidth) * 100;
      // Limit the width between 20% and 80%
      const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth]);

  const handleRunCode = async () => {
    try {
      setExecuting(true);
      setOutput('');
      setTestResults(null);
      setTab(0); // Switch to output tab

      // Get the first test case from the test object
      let input = test.sampleInput || '';

      // If the test has test cases, use the first non-hidden one
      if (test.testCases && Array.isArray(test.testCases) && test.testCases.length > 0) {
        const visibleTestCase = test.testCases.find(tc => !tc.isHidden);
        if (visibleTestCase) {
          input = visibleTestCase.input;
        }
      }

      console.log('Executing code with input:', input);

      // Include assessmentId in the request for proper permission handling
      const data = await executeCode({
        code,
        language,
        input,
        assessmentId: assessmentId, // Pass assessmentId for permission validation
        testId: id // Pass the test ID explicitly
      });

      console.log('Code execution response:', data);

      if (data && data.output) {
        setOutput(data.output);
      } else if (data && data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput('No output received from the server.');
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleRunTests = async () => {
    try {
      setExecuting(true);
      setOutput('');
      setTestResults(null);
      setTab(1); // Switch to test results tab

      console.log('Running test cases for test ID:', id);

      // Include assessmentId in the request for proper permission handling
      const data = await runTestCases(id, {
        code,
        language,
        assessmentId: assessmentId, // Pass assessmentId for permission validation
        testId: id // Pass the test ID explicitly in case the API needs it
      });

      console.log('Test case execution response:', data);

      setTestResults(data);
    } catch (error) {
      console.error('Error running tests:', error);
      setOutput(`Error: ${error.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Check if user has attempts remaining
      if (attemptsUsed >= maxAttempts) {
        toast.error(`Maximum attempts (${maxAttempts}) reached for this test.`);
        setOutput(`Error: You have reached the maximum number of attempts (${maxAttempts}) for this test.`);
        return;
      }

      // Check if the assessment has been submitted
      if (assessmentSubmitted) {
        toast.error('This assessment has been submitted. You cannot make further submissions.');
        setOutput('Error: This assessment has been submitted. You cannot make further submissions.');
        return;
      }

      setSubmitting(true);
      setOutput('');

      // Include assessmentId in the request for proper permission handling
      const data = await submitCode(id, {
        code,
        language,
        assessmentId: assessmentId, // Pass assessmentId for permission validation
        testId: id // Pass the test ID explicitly in case the API needs it
      });

      // Update attempts information if returned from the server
      if (data.attemptsUsed !== undefined && data.maxAttempts !== undefined) {
        setAttemptsUsed(data.attemptsUsed);
        setMaxAttempts(data.maxAttempts);
      } else {
        // If not returned from server, increment locally
        setAttemptsUsed(prev => prev + 1);
      }

      // Show test results if available
      if (data.testResults) {
        setTestResults({
          results: data.testResults,
          summary: {
            totalTestCases: data.totalTestCases || data.testResults.length,
            passedTestCases: data.testCasesPassed || data.testResults.filter(tc => tc.passed).length,
            failedTestCases: (data.totalTestCases || data.testResults.length) -
                            (data.testCasesPassed || data.testResults.filter(tc => tc.passed).length),
            status: data.status || 'Completed'
          }
        });
        setTab(1); // Switch to test results tab
      }

      setSubmitSuccess(true);
      toast.success(`Solution submitted successfully! You have used ${attemptsUsed + 1} of ${maxAttempts} attempts.`);
    } catch (error) {
      console.error('Error submitting code:', error);

      // Check if the error is due to maximum attempts reached
      if (error.message && error.message.includes('Maximum attempts reached')) {
        try {
          const errorData = JSON.parse(error.message.split('Server details:')[1].trim());
          if (errorData.attemptsUsed && errorData.maxAttempts) {
            setAttemptsUsed(errorData.attemptsUsed);
            setMaxAttempts(errorData.maxAttempts);
          }
        } catch (parseError) {
          console.error('Error parsing attempts data:', parseError);
        }

        toast.error(`Maximum attempts (${maxAttempts}) reached for this test.`);
        setOutput(`Error: You have reached the maximum number of attempts (${maxAttempts}) for this test.`);
      } else {
        toast.error(`Error: ${error.message}`);
        setOutput(`Error: ${error.message}`);
      }

      setSubmitSuccess(false);
    } finally {
      setSubmitting(false);
    }
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
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Error
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '600px', mx: 'auto', mb: 3 }}>
            {error}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to="/dashboard"
            >
              Return to Dashboard
            </Button>
            {assessmentId && (
              <Button
                variant="outlined"
                color="secondary"
                component={RouterLink}
                to={`/assessments/${assessmentId}/view`}
              >
                Back to Assessment
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            This could be due to a permission issue or the test may not exist.
            If you believe you should have access to this test, please contact your instructor or administrator.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', width: '100%' }} className="test-page-container">
      <Box sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {test.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={test.difficulty}
                size="medium"
                color={
                  test.difficulty === 'Easy' ? 'success' :
                    test.difficulty === 'Medium' ? 'warning' : 'error'
                }
                sx={{ fontWeight: 600, px: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Created by {test.createdBy?.name || 'Admin'}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            component={RouterLink}
            to={assessmentId ? `/assessments/${assessmentId}/view` : "/tests"}
            sx={{ borderRadius: 2 }}
          >
            {assessmentId ? 'Back to Assessment' : 'Back to Challenges'}
          </Button>
        </Box>

        <Box className="split-view-container">
          {/* Problem Description */}
          <Box className="problem-panel" sx={{ width: `${panelWidth}%` }}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              className="problem-description-container"
            >
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                px: 3,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Problem Description
                </Typography>
              </Box>

              <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Problem Statement
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                  {test.problemStatement}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Input Format
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                  {test.inputFormat}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Output Format
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                  {test.outputFormat}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Constraints
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.7, mb: 2 }}>
                  {test.constraints}
                </Typography>

                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Input
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {test.sampleInput}
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Output
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {test.sampleOutput}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Resizer */}
          <div className="resizer" ref={resizerRef} onMouseDown={handleMouseDown}></div>

          {/* Code Editor and Output */}
          <Box className="editor-panel" sx={{ width: `${100 - panelWidth}%`, display: 'flex', flexDirection: 'column' }}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                mb: 3,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 0, /* Don't let it grow and push buttons off screen */
                height: 'auto',
                maxHeight: '60vh' /* Limit height to ensure buttons are visible */
              }}
            >
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                px: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Code Editor
                </Typography>
                <FormControl sx={{ minWidth: 150 }} size="small" variant="outlined">
                  <InputLabel id="language-select-label" sx={{ color: 'white' }}>Language</InputLabel>
                  <Select
                    labelId="language-select-label"
                    id="language-select"
                    value={language}
                    label="Language"
                    onChange={handleLanguageChange}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                      },
                      '.MuiSvgIcon-root': {
                        color: 'white',
                      }
                    }}
                  >
                    <MenuItem value="python">Python</MenuItem>
                    <MenuItem value="cpp">C++</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flexGrow: 1, minHeight: '350px', maxHeight: 'calc(100vh - 350px)' }} className="monaco-editor-container">
                <Editor
                  height="100%"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    lineHeight: 1.5,
                    automaticLayout: true
                  }}
                  onMount={handleEditorDidMount}
                />
              </Box>
            </Paper>

            {/* BUTTONS MOVED OUTSIDE THE EDITOR CONTAINER */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                bgcolor: '#e3f2fd',
                position: 'relative',
                zIndex: 10,
                border: '2px solid #1976d2',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1565c0' }}>
                Code Actions
              </Typography>

              {/* Attempts information and navigation */}
              {assessmentId && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Attempts:</strong> {attemptsUsed} of {maxAttempts} used
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={RouterLink}
                      to={`/assessments/${assessmentId}/view`}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Back to Assessment
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 2, bgcolor: '#f0f7ff', p: 2, borderRadius: 2, border: '1px solid #2196f3' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRunCode}
                  disabled={executing || submitting || submittingAssessment}
                  sx={{ px: 4, py: 2, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold', minWidth: '120px' }}
                >
                  Run Code
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRunTests}
                  disabled={executing || submitting || submittingAssessment}
                  sx={{ px: 4, py: 2, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold', minWidth: '120px' }}
                >
                  Run Tests
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={executing || submitting || submittingAssessment || attemptsUsed >= maxAttempts || assessmentSubmitted}
                  sx={{ ml: 'auto', px: 4, py: 2, borderRadius: 2, fontWeight: 'bold', fontSize: '1rem', minWidth: '150px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </Button>
              </Box>
            </Paper>

            {submitSuccess && (
              <Alert
                severity="success"
                variant="filled"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: 2
                }}
              >
                Solution submitted successfully! Check the Test Results tab for details.
              </Alert>
            )}



            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '250px',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
                mb: 3 /* Add margin to avoid footer overlap */
              }}
            >
              <Box sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}>
                <Tabs
                  value={tab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': {
                      py: 1.5,
                      fontWeight: 600
                    }
                  }}
                >
                  <Tab label="Output" />
                  <Tab label="Test Results" />
                </Tabs>
              </Box>

              <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', minHeight: '180px' }} className="output-container">
                {executing ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {tab === 0 && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          bgcolor: 'grey.900',
                          color: 'grey.100',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          minHeight: '150px',
                          height: '100%',
                          overflow: 'auto',
                          borderRadius: 2,
                          fontSize: '14px',
                          lineHeight: 1.5
                        }}
                      >
                        {output || 'Run your code to see the output here.'}
                      </Paper>
                    )}

                    {tab === 1 && (
                      <Box sx={{ height: '100%', minHeight: '150px', overflow: 'auto' }}>
                        {testResults ? (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: testResults.summary?.passedTestCases === testResults.summary?.totalTestCases ? 'success.50' : 'warning.50',
                                border: 1,
                                borderColor: testResults.summary?.passedTestCases === testResults.summary?.totalTestCases ? 'success.main' : 'warning.main'
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                Test Results:
                              </Typography>
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                color={testResults.summary?.passedTestCases === testResults.summary?.totalTestCases ? 'success.main' : 'warning.main'}
                                sx={{ ml: 1 }}
                              >
                                {testResults.summary?.passedTestCases || 0}/{testResults.summary?.totalTestCases || 0} Passed
                              </Typography>
                            </Box>

                            <Grid container spacing={2}>
                              {testResults.results?.map((result, index) => (
                                <Grid item xs={12} key={index}>
                                  <Paper
                                    elevation={1}
                                    sx={{
                                      p: 2,
                                      borderRadius: 2,
                                      bgcolor: result.passed ? 'success.50' : 'error.50',
                                      borderLeft: 4,
                                      borderColor: result.passed ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="subtitle2" fontWeight="bold">
                                        Test Case {index + 1}:
                                      </Typography>
                                      <Chip
                                        label={result.passed ? 'Passed' : 'Failed'}
                                        color={result.passed ? 'success' : 'error'}
                                        size="small"
                                        sx={{ ml: 2, fontWeight: 600 }}
                                      />
                                    </Box>

                                    {/* Always show input/output details, even for passed tests */}
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
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </>
                        ) : (
                          <Typography variant="body1">Run tests to see results.</Typography>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TestPage;
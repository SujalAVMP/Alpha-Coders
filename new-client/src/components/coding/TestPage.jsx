import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getTestById, executeCode, runTestCases, submitCode } from '../../utils/api';
import Editor from '@monaco-editor/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Divider,
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

  // Language templates
  const languageTemplates = {
    python: `def solution(nums, target):
    # Your code here
    pass

# Read input
nums = eval(input().strip())
target = int(input().strip())

# Call function and print result
print(solution(nums, target))`,
    cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>

std::vector<int> solution(std::vector<int>& nums, int target) {
    // Your code here
    return {};
}

// Parse input string to vector
std::vector<int> parseInput(const std::string& input) {
    std::vector<int> result;
    std::stringstream ss(input.substr(1, input.size() - 2)); // Remove [ and ]
    std::string item;
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<int> nums = parseInput(input);

    int target;
    std::cin >> target;

    // Call solution
    std::vector<int> result = solution(nums, target);

    // Print result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << result[i];
    }
    std::cout << "]" << std::endl;

    return 0;
}`
  };

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const data = await getTestById(id);
        setTest(data);
        // Set initial code template based on selected language
        setCode(languageTemplates[language]);
      } catch (error) {
        console.error('Error fetching test:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(languageTemplates[newLanguage]);
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleRunCode = async () => {
    try {
      setExecuting(true);
      setOutput('');
      setTestResults(null);

      const data = await executeCode({
        code,
        language,
        input: test.sampleInput
      });

      setOutput(data.output);
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

      const data = await runTestCases(id, {
        code,
        language
      });

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
      setSubmitting(true);
      setOutput('');

      const data = await submitCode(id, {
        code,
        language
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate(`/submissions/${data._id}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting code:', error);
      setOutput(`Error: ${error.message}`);
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
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading test
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
      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
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
            to="/tests"
            sx={{ borderRadius: 2 }}
          >
            Back to Challenges
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Problem Description */}
          <Grid item xs={12} md={5} lg={4}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
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
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                  {test.problemStatement}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Input Format
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                  {test.inputFormat}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Output Format
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
                  {test.outputFormat}
                </Typography>

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Constraints
                </Typography>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
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
          </Grid>

          {/* Code Editor and Output */}
          <Grid item xs={12} md={7} lg={8}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                mb: 3
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

              <Box sx={{ border: 0, borderColor: 'grey.300' }}>
                <Editor
                  height="450px"
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
                    lineHeight: 1.5
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, p: 3, bgcolor: 'grey.100', borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRunCode}
                  disabled={executing || submitting}
                  sx={{ px: 3, py: 1, borderRadius: 2 }}
                >
                  Run Code
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRunTests}
                  disabled={executing || submitting}
                  sx={{ px: 3, py: 1, borderRadius: 2 }}
                >
                  Run Tests
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={executing || submitting}
                  sx={{ ml: 'auto', px: 4, py: 1, borderRadius: 2, fontWeight: 600 }}
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
                Solution submitted successfully! Redirecting to submission details...
              </Alert>
            )}

            <Paper
              elevation={2}
              sx={{
                borderRadius: 3,
                overflow: 'hidden'
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
                      py: 2,
                      fontWeight: 600
                    }
                  }}
                >
                  <Tab label="Output" />
                  <Tab label="Test Results" />
                </Tabs>
              </Box>

              <Box sx={{ p: 3, minHeight: '200px' }}>
                {executing ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {tab === 0 && (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          bgcolor: 'grey.900',
                          color: 'grey.100',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          minHeight: '200px',
                          maxHeight: '300px',
                          overflow: 'auto',
                          borderRadius: 2
                        }}
                      >
                        {output || 'Run your code to see the output here.'}
                      </Paper>
                    )}

                    {tab === 1 && (
                      <Box>
                        {testResults ? (
                          <>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: testResults.passed === testResults.total ? 'success.50' : 'warning.50',
                                border: 1,
                                borderColor: testResults.passed === testResults.total ? 'success.main' : 'warning.main'
                              }}
                            >
                              <Typography variant="h6" fontWeight="bold" color="text.primary">
                                Test Results:
                              </Typography>
                              <Typography
                                variant="h6"
                                fontWeight="bold"
                                color={testResults.passed === testResults.total ? 'success.main' : 'warning.main'}
                                sx={{ ml: 1 }}
                              >
                                {testResults.passed}/{testResults.total} Passed
                              </Typography>
                            </Box>

                            <Grid container spacing={2}>
                              {testResults.results.map((result, index) => (
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
                          </>
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
                              No test results yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Click "Run Tests" to check your solution against the test cases.
                            </Typography>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleRunTests}
                              sx={{ mt: 3 }}
                            >
                              Run Tests
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TestPage;

import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { getTestById, updateTest, createTest, getTestTemplates } from '../../utils/api';

const TestEditor = () => {
  const { testId } = useParams();
  const isNewTest = !testId;
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Test data state
  const [test, setTest] = useState({
    title: '',
    description: '',
    difficulty: 'Medium',
    timeLimit: 60,
    problemStatement: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    testCases: []
  });

  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [testCaseInput, setTestCaseInput] = useState('');
  const [testCaseOutput, setTestCaseOutput] = useState('');
  const [isHidden, setIsHidden] = useState(false);

  // Template state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch test data if editing an existing test
  useEffect(() => {
    if (!isNewTest) {
      fetchTestData();
    } else {
      setLoading(false);
      // Load templates for new tests
      fetchTemplates();
    }
  }, [testId]);

  // Fetch test data for editing
  const fetchTestData = async () => {
    try {
      setLoading(true);
      const testData = await getTestById(testId);
      setTest(testData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching test data:', err);
      setError('Failed to load test data. Please try again.');
      setLoading(false);
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      console.log('Fetching test templates...');
      const templatesData = await getTestTemplates();
      console.log('Received templates:', templatesData);

      if (templatesData && Array.isArray(templatesData)) {
        // Add an index property to each template for easier selection
        const templatesWithIndex = templatesData.map((template, index) => ({
          ...template,
          id: template.id || template._id || `template-${index}`
        }));

        setTemplates(templatesWithIndex);
        console.log('Processed templates:', templatesWithIndex);
      } else {
        console.warn('No templates received or invalid format');
        setTemplates([]);
      }

      setLoadingTemplates(false);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setLoadingTemplates(false);
      setError('Failed to load templates. Please try again.');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle template selection
  const handleTemplateChange = (event) => {
    try {
      const templateId = event.target.value;
      console.log('Template selected:', templateId);
      setSelectedTemplate(templateId);

      if (templateId) {
        // Find the template by ID
        const template = templates.find(t => t.id === templateId);
        console.log('Found template:', template);

        if (template) {
          // Pre-fill form with template data
          const updatedTest = {
            title: template.title || '',
            description: template.description || '',
            difficulty: template.difficulty || 'Medium',
            timeLimit: template.timeLimit || 60,
            problemStatement: template.problemStatement || '',
            inputFormat: template.inputFormat || '',
            outputFormat: template.outputFormat || '',
            constraints: template.constraints || '',
            sampleInput: template.sampleInput || '',
            sampleOutput: template.sampleOutput || '',
            testCases: Array.isArray(template.testCases) ? [...template.testCases] : []
          };

          console.log('Setting test data from template:', updatedTest);
          setTest(updatedTest);

          // Move to the Basic Info tab to show the populated data
          setTabValue(0);
          setError('');
        } else {
          console.warn('Template not found with ID:', templateId);
          setError('Template not found. Please try another one.');
        }
      }
    } catch (err) {
      console.error('Error in handleTemplateChange:', err);
      setError('Error applying template. Please try again.');
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a test case
  const handleAddTestCase = () => {
    if (!testCaseInput.trim() || !testCaseOutput.trim()) {
      setError('Please provide both input and expected output for the test case.');
      return;
    }

    const newTestCase = {
      input: testCaseInput,
      expected: testCaseOutput,
      isHidden
    };

    setTest(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));

    // Clear inputs
    setTestCaseInput('');
    setTestCaseOutput('');
    setIsHidden(false);
    setError('');
  };

  // Remove a test case
  const handleRemoveTestCase = (index) => {
    setTest(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  // Save the test
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate required fields
      if (!test.title.trim()) {
        setError('Please enter a test title.');
        setSaving(false);
        return;
      }

      if (!test.problemStatement.trim()) {
        setError('Please enter a problem statement.');
        setSaving(false);
        return;
      }

      if (test.testCases.length === 0) {
        setError('Please add at least one test case.');
        setSaving(false);
        return;
      }

      // Create or update the test
      if (isNewTest) {
        await createTest(test);
        setSuccess('Test created successfully!');
        setTimeout(() => navigate('/tests'), 1500);
      } else {
        await updateTest(testId, test);
        setSuccess('Test updated successfully!');
      }
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Failed to save test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}>
          Dashboard
        </Link>
        <Link color="inherit" onClick={() => navigate('/tests')} sx={{ cursor: 'pointer' }}>
          Tests
        </Link>
        <Typography color="text.primary">{isNewTest ? 'New Test' : 'Edit Test'}</Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{isNewTest ? 'Create New Test' : 'Edit Test'}</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tests')}
        >
          Back to Tests
        </Button>
      </Box>

      {/* Error and success messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Template selection for new tests */}
          {isNewTest && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Start with a Template (Optional)
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="template-select-label">Select Template</InputLabel>
                <Select
                  labelId="template-select-label"
                  id="template-select"
                  value={selectedTemplate}
                  label="Select Template"
                  onChange={handleTemplateChange}
                  disabled={loadingTemplates}
                >
                  <MenuItem value="">
                    <em>None (Create from scratch)</em>
                  </MenuItem>
                  {templates.length > 0 ? (
                    templates.map((template) => (
                      <MenuItem
                        key={template.id}
                        value={template.id}
                        onClick={(e) => {
                          // Prevent any default behavior
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {template.title} ({template.difficulty || 'Unknown'})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No templates available</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {loadingTemplates && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Paper>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Basic Info" />
              <Tab label="Problem Statement" />
              <Tab label="Test Cases" />
            </Tabs>
          </Box>

          {/* Basic Info Tab */}
          {tabValue === 0 && (
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Test Title"
                    name="title"
                    fullWidth
                    value={test.title}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={3}
                    value={test.description}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      name="difficulty"
                      value={test.difficulty}
                      label="Difficulty"
                      onChange={handleChange}
                    >
                      <MenuItem value="None">Don't disclose</MenuItem>
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Time Limit (minutes)"
                    name="timeLimit"
                    type="number"
                    value={test.timeLimit}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 120 } }}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Problem Statement Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Problem Statement"
                    name="problemStatement"
                    fullWidth
                    multiline
                    rows={6}
                    value={test.problemStatement}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Input Format"
                    name="inputFormat"
                    fullWidth
                    multiline
                    rows={3}
                    value={test.inputFormat}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Output Format"
                    name="outputFormat"
                    fullWidth
                    multiline
                    rows={3}
                    value={test.outputFormat}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Constraints"
                    name="constraints"
                    fullWidth
                    multiline
                    rows={2}
                    value={test.constraints}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Sample Input"
                    name="sampleInput"
                    fullWidth
                    multiline
                    rows={3}
                    value={test.sampleInput}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Sample Output"
                    name="sampleOutput"
                    fullWidth
                    multiline
                    rows={3}
                    value={test.sampleOutput}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Test Cases Tab */}
          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add Test Cases
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Test cases are used to validate user submissions. Add at least one test case.
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Input"
                    fullWidth
                    multiline
                    rows={4}
                    value={testCaseInput}
                    onChange={(e) => setTestCaseInput(e.target.value)}
                    placeholder="Enter input for the test case"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Expected Output"
                    fullWidth
                    multiline
                    rows={4}
                    value={testCaseOutput}
                    onChange={(e) => setTestCaseOutput(e.target.value)}
                    placeholder="Enter expected output for the test case"
                  />
                </Grid>
                <Grid item xs={12} md={2} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <FormControl component="fieldset">
                    <Typography variant="body2" color="textSecondary">
                      Hidden from users?
                    </Typography>
                    <Select
                      value={isHidden ? "yes" : "no"}
                      onChange={(e) => setIsHidden(e.target.value === "yes")}
                      size="small"
                    >
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddTestCase}
                    sx={{ mt: 2 }}
                  >
                    Add Test Case
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Test Cases ({test.testCases.length})
              </Typography>

              {test.testCases.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
                  No test cases added yet. Add at least one test case above.
                </Typography>
              ) : (
                <List>
                  {test.testCases.map((testCase, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: testCase.isHidden ? '#f5f5f5' : 'transparent'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            Test Case #{index + 1} {testCase.isHidden && '(Hidden)'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" display="block">
                              <strong>Input:</strong> {testCase.input}
                            </Typography>
                            <Typography variant="body2" component="span" display="block">
                              <strong>Expected Output:</strong> {testCase.expected}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveTestCase(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {/* Save button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Test'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default TestEditor;

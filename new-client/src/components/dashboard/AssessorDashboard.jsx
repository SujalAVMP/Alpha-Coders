import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccessTime as AccessTimeIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { getMyTests, getMyAssessments, createTest, deleteTest, getTestById, getAssessees, inviteStudentsByIds, inviteStudentsByEmail, getTestTemplates, createTestFromTemplate } from '../../utils/api';
import { fetchAPI } from '../../utils/api';

const AssessorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tabValue, setTabValue] = useState(0); // Start with Assessments tab (index 0)
  const [tests, setTests] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [testTemplates, setTestTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [openCreateTest, setOpenCreateTest] = useState(false);
  const [openCreateAssessment, setOpenCreateAssessment] = useState(false);
  const [openInviteStudents, setOpenInviteStudents] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Registered assessees for invitation
  const [registeredAssessees, setRegisteredAssessees] = useState([]);
  const [loadingAssessees, setLoadingAssessees] = useState(false);

  // Form states
  const [newTest, setNewTest] = useState({
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
    isPublic: false
  });

  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    tests: [],
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 week from now
    maxAttempts: 1,
    isPublic: false
  });

  // Invitation states
  const [inviteEmails, setInviteEmails] = useState('');
  const [selectedAssessees, setSelectedAssessees] = useState([]);

  // Fetch tests and assessments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch tests created by this assessor
        const testsData = await getMyTests();
        setTests(testsData || []);

        // Fetch assessments created by this assessor
        try {
          const assessmentsData = await getMyAssessments();
          setAssessments(assessmentsData || []);
        } catch (err) {
          console.error('Error fetching assessments:', err);
          setAssessments([]);
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to fetch test templates
  const fetchTestTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const templatesData = await getTestTemplates();
      setTestTemplates(templatesData || []);
    } catch (err) {
      console.error('Error fetching test templates:', err);
      setError('Failed to load test templates. Please try again.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Function to create a test from a template
  const handleCreateFromTemplate = async (templateIndex) => {
    try {
      setLoading(true);
      setError('');

      const createdTest = await createTestFromTemplate(templateIndex);

      // Add the new test to the tests array
      setTests([...tests, createdTest]);

      // Show success message
      alert(`Test "${createdTest.title}" created successfully! You can now edit it.`);

      // Navigate to the edit page
      navigate(`/tests/${createdTest._id}/edit`);

    } catch (err) {
      console.error('Error creating test from template:', err);
      setError('Failed to create test from template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle test creation
  const handleCreateTest = async () => {
    try {
      setLoading(true);
      setError('');

      const createdTest = await createTest(newTest);

      setTests([...tests, createdTest]);
      setOpenCreateTest(false);
      setNewTest({
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
        isPublic: false
      });

    } catch (err) {
      console.error('Error creating test:', err);
      setError('Failed to create test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle assessment creation
  const handleCreateAssessment = async () => {
    try {
      setLoading(true);
      setError('');

      // In a real app, we would create the assessment here
      const mockAssessment = {
        id: Date.now().toString(),
        ...newAssessment,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };

      setAssessments([...assessments, mockAssessment]);
      setOpenCreateAssessment(false);
      setNewAssessment({
        title: '',
        description: '',
        tests: [],
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        maxAttempts: 1,
        isPublic: false
      });

    } catch (err) {
      console.error('Error creating assessment:', err);
      setError('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle test deletion
  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await deleteTest(id);

      setTests(tests.filter(test => test._id !== id));

    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle assessment deletion
  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // In a real app, we would delete the assessment here

      setAssessments(assessments.filter(assessment => assessment.id !== id));

    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError('Failed to delete assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered assessees for invitation
  const fetchAssessees = async () => {
    try {
      setLoadingAssessees(true);
      const assesseesData = await getAssessees();
      setRegisteredAssessees(assesseesData || []);
    } catch (err) {
      console.error('Error fetching assessees:', err);
      setError('Failed to load registered assessees. Please try again.');
    } finally {
      setLoadingAssessees(false);
    }
  };

  // Handle opening the invite dialog
  const handleOpenInviteDialog = (assessment) => {
    setSelectedAssessment(assessment);
    setSelectedAssessees([]);
    setInviteEmails('');
    setOpenInviteStudents(true);
    fetchAssessees(); // Fetch assessees when opening the dialog
  };

  // Handle inviting students
  const handleInviteStudents = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if we have selected assessees or entered emails
      if (selectedAssessees.length === 0 && !inviteEmails.trim()) {
        setError('Please select at least one student or enter email addresses.');
        setLoading(false);
        return;
      }

      // Combine both invitation methods into a single API call
      try {
        // Get the IDs from selected assessees
        const userIds = selectedAssessees.map(id => id);

        // Get the emails from the text field
        const emails = inviteEmails.trim() ? inviteEmails : '';

        console.log('Inviting students:', { userIds, emails, assessmentId: selectedAssessment.id });

        // Process selected assessees (by ID)
        if (userIds.length > 0) {
          await inviteStudentsByIds(selectedAssessment.id, userIds);
          console.log('Invited students by ID:', userIds);
        }

        // Process manually entered emails
        if (emails) {
          await inviteStudentsByEmail(selectedAssessment.id, emails);
          console.log('Invited students by email:', emails);
        }

        console.log('Successfully invited students');
      } catch (err) {
        console.error('Error inviting students:', err);
        setError('Failed to invite students. Please try again.');
      }

      // Refresh assessments to show updated invited users
      try {
        const assessmentsData = await getMyAssessments();
        setAssessments(assessmentsData || []);
      } catch (err) {
        console.error('Error refreshing assessments:', err);
      }

      // Close dialog and reset state
      setOpenInviteStudents(false);
      setInviteEmails('');
      setSelectedAssessees([]);
      setSelectedAssessment(null);

      // Show success message
      alert('Invitations sent successfully!');

    } catch (err) {
      console.error('Error inviting students:', err);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && tests.length === 0 && assessments.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Assessor Dashboard
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.name || 'Assessor'}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="My Assessments" />
          <Tab label="Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Assessments Tab */}
          {tabValue === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  My Assessments
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/tests/new')}
                >
                  Create New Assessment
                </Button>
              </Box>

              {assessments.length === 0 ? (
                <Box>
                  <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Welcome to the Assessor Dashboard!
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                      As an assessor, you can create programming assessments and invite students to take them.
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                      You haven't created any assessments yet. Click the button above to create your first assessment.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sample Test Templates
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchTestTemplates}
                        disabled={loadingTemplates}
                      >
                        {loadingTemplates ? <CircularProgress size={20} /> : 'Load Templates'}
                      </Button>
                    </Box>

                    {testTemplates.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                        Click the button above to load sample test templates.
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {testTemplates.map((template, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" component="h2" gutterBottom>
                                  {template.title}
                                </Typography>

                                <Typography variant="body2" color="textSecondary" paragraph>
                                  {template.description}
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                  <Chip
                                    label={template.difficulty}
                                    size="small"
                                    color={
                                      template.difficulty === 'Easy' ? 'success' :
                                      template.difficulty === 'Medium' ? 'warning' : 'error'
                                    }
                                  />
                                  <Chip
                                    label={`${template.timeLimit} min`}
                                    size="small"
                                    icon={<AccessTimeIcon />}
                                  />
                                </Box>
                              </CardContent>

                              <CardActions>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  fullWidth
                                  onClick={() => handleCreateFromTemplate(index)}
                                >
                                  Use This Template
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Getting Started Guide
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="1. Create an Assessment"
                          secondary="Start by creating an assessment with multiple programming questions."
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="2. Add Questions"
                          secondary="Choose from our library of pre-defined questions or create your own custom questions."
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="3. Invite Students"
                          secondary="Invite students by email to take your assessments."
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="4. Review Results"
                          secondary="Track student progress and review their submissions."
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {assessments.map((assessment) => (
                    <Grid item xs={12} md={6} key={assessment.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {assessment.title}
                          </Typography>

                          <Typography variant="body2" color="textSecondary" paragraph>
                            {assessment.description}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                              {assessment.tests.length} Questions Included
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              Start: {new Date(assessment.startTime).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              End: {new Date(assessment.endTime).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                              Max Attempts: {assessment.maxAttempts}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                              Invited Students: {assessment.invitedUsers?.length || 0}
                            </Typography>

                            {assessment.invitedUsers?.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {assessment.invitedUsers.slice(0, 3).map(user => (
                                  <Chip
                                    key={user.id}
                                    label={user.name || user.email}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {assessment.invitedUsers.length > 3 && (
                                  <Chip
                                    label={`+${assessment.invitedUsers.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        </CardContent>

                        <Divider />

                        <CardActions>
                          <Button
                            size="small"
                            component={Link}
                            to={`/assessments/${assessment.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            component={Link}
                            to={`/assessments/${assessment.id}/edit`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => handleOpenInviteDialog(assessment)}
                          >
                            Invite
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAssessment(assessment.id)}
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Assessments Tab */}
          {tabValue === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Technical Assessments
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateAssessment(true)}
                >
                  Create New Assessment
                </Button>
              </Box>

              {assessments.length === 0 ? (
                <Box>
                  <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                    <Typography variant="body1" color="textSecondary" paragraph>
                      You haven't created any assessments yet. Click the button above to create your first assessment.
                    </Typography>

                    {tests.length === 0 ? (
                      <Alert severity="warning" sx={{ mt: 2, textAlign: 'left' }}>
                        You need to create at least one test before you can create an assessment. Go to the "My Tests" tab to create a test first.
                      </Alert>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreateAssessment(true)}
                        sx={{ mt: 2 }}
                      >
                        Create New Assessment
                      </Button>
                    )}
                  </Paper>

                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      About Assessments
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Assessments are collections of tests that you can assign to students. You can:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Set time limits for the entire assessment" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Limit the number of attempts allowed" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Invite specific students by email" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Make assessments public or private" />
                      </ListItem>
                    </List>
                  </Paper>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {assessments.map((assessment) => (
                    <Grid item xs={12} md={6} key={assessment.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {assessment.title}
                          </Typography>

                          <Typography variant="body2" color="textSecondary" paragraph>
                            {assessment.description}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <CodeIcon fontSize="small" sx={{ mr: 1 }} />
                              {assessment.tests.length} Tests Included
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              Start: {new Date(assessment.startTime).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              End: {new Date(assessment.endTime).toLocaleString()}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                              Max Attempts: {assessment.maxAttempts}
                            </Typography>

                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                              Invited Students: {assessment.invitedUsers?.length || 0}
                            </Typography>

                            {assessment.invitedUsers?.length > 0 && (
                              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {assessment.invitedUsers.slice(0, 3).map(user => (
                                  <Chip
                                    key={user.id}
                                    label={user.name || user.email}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {assessment.invitedUsers.length > 3 && (
                                  <Chip
                                    label={`+${assessment.invitedUsers.length - 3} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        </CardContent>

                        <Divider />

                        <CardActions>
                          <Button
                            size="small"
                            component={Link}
                            to={`/assessments/${assessment.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            component={Link}
                            to={`/assessments/${assessment.id}/edit`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => handleOpenInviteDialog(assessment)}
                          >
                            Invite
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAssessment(assessment.id)}
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Analytics Tab */}
          {tabValue === 2 && (
            <>
              <Typography variant="h6" gutterBottom>
                Performance Analytics
              </Typography>

              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Analytics features will be available soon.
                </Typography>
              </Paper>
            </>
          )}
        </Box>
      </Paper>

      {/* Create Test Dialog */}
      <Dialog
        open={openCreateTest}
        onClose={() => setOpenCreateTest(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Programming Test</DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                required
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={newTest.difficulty}
                  label="Difficulty"
                  onChange={(e) => setNewTest({ ...newTest, difficulty: e.target.value })}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Time Limit (minutes)"
                type="number"
                fullWidth
                value={newTest.timeLimit}
                onChange={(e) => setNewTest({ ...newTest, timeLimit: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Problem Statement"
                fullWidth
                multiline
                rows={4}
                required
                value={newTest.problemStatement}
                onChange={(e) => setNewTest({ ...newTest, problemStatement: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Input Format"
                fullWidth
                multiline
                rows={3}
                value={newTest.inputFormat}
                onChange={(e) => setNewTest({ ...newTest, inputFormat: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Output Format"
                fullWidth
                multiline
                rows={3}
                value={newTest.outputFormat}
                onChange={(e) => setNewTest({ ...newTest, outputFormat: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Constraints"
                fullWidth
                multiline
                rows={2}
                value={newTest.constraints}
                onChange={(e) => setNewTest({ ...newTest, constraints: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Sample Input"
                fullWidth
                multiline
                rows={3}
                value={newTest.sampleInput}
                onChange={(e) => setNewTest({ ...newTest, sampleInput: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Sample Output"
                fullWidth
                multiline
                rows={3}
                value={newTest.sampleOutput}
                onChange={(e) => setNewTest({ ...newTest, sampleOutput: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={newTest.isPublic}
                  label="Visibility"
                  onChange={(e) => setNewTest({ ...newTest, isPublic: e.target.value })}
                >
                  <MenuItem value={false}>Private (Invite Only)</MenuItem>
                  <MenuItem value={true}>Public (Available to All)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenCreateTest(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateTest}
            disabled={!newTest.title || !newTest.problemStatement}
          >
            Create Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Assessment Dialog */}
      <Dialog
        open={openCreateAssessment}
        onClose={() => setOpenCreateAssessment(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Technical Assessment</DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                required
                value={newAssessment.title}
                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newAssessment.description}
                onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Select Tests to Include
              </Typography>

              {tests.length === 0 ? (
                <Alert severity="info">
                  You need to create tests first before you can include them in an assessment.
                </Alert>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                  <List dense>
                    {tests.map((test) => (
                      <ListItem key={test._id}>
                        <ListItemText
                          primary={test.title}
                          secondary={`${test.difficulty} • ${test.timeLimit} min`}
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            variant={newAssessment.tests.includes(test._id) ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => {
                              if (newAssessment.tests.includes(test._id)) {
                                setNewAssessment({
                                  ...newAssessment,
                                  tests: newAssessment.tests.filter(id => id !== test._id)
                                });
                              } else {
                                setNewAssessment({
                                  ...newAssessment,
                                  tests: [...newAssessment.tests, test._id]
                                });
                              }
                            }}
                          >
                            {newAssessment.tests.includes(test._id) ? "Selected" : "Select"}
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Time"
                type="datetime-local"
                fullWidth
                value={newAssessment.startTime}
                onChange={(e) => setNewAssessment({ ...newAssessment, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="End Time"
                type="datetime-local"
                fullWidth
                value={newAssessment.endTime}
                onChange={(e) => setNewAssessment({ ...newAssessment, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Maximum Attempts"
                type="number"
                fullWidth
                value={newAssessment.maxAttempts}
                onChange={(e) => setNewAssessment({ ...newAssessment, maxAttempts: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={newAssessment.isPublic}
                  label="Visibility"
                  onChange={(e) => setNewAssessment({ ...newAssessment, isPublic: e.target.value })}
                >
                  <MenuItem value={false}>Private (Invite Only)</MenuItem>
                  <MenuItem value={true}>Public (Available to All)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenCreateAssessment(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateAssessment}
            disabled={!newAssessment.title || newAssessment.tests.length === 0}
          >
            Create Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Students Dialog */}
      <Dialog
        open={openInviteStudents}
        onClose={() => setOpenInviteStudents(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Invite Students to Assessment</DialogTitle>

        <DialogContent dividers>
          {selectedAssessment && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Assessment: {selectedAssessment.title}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Select Registered Students
                  </Typography>

                  {loadingAssessees ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : registeredAssessees.length === 0 ? (
                    <Alert severity="info">
                      No registered assessees found. You can still invite students by email below.
                    </Alert>
                  ) : (
                    <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
                      <List dense>
                        {registeredAssessees.map((assessee) => {
                          const isSelected = selectedAssessees.includes(assessee.id);
                          const isAlreadyInvited = selectedAssessment.invitedUsers?.some(u => u.id === assessee.id);

                          return (
                            <ListItem key={assessee.id}>
                              <ListItemText
                                primary={assessee.name}
                                secondary={assessee.email}
                              />
                              <ListItemSecondaryAction>
                                {isAlreadyInvited ? (
                                  <Chip
                                    label="Already Invited"
                                    size="small"
                                    color="success"
                                  />
                                ) : (
                                  <Button
                                    size="small"
                                    variant={isSelected ? "contained" : "outlined"}
                                    color="primary"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedAssessees(selectedAssessees.filter(id => id !== assessee.id));
                                      } else {
                                        setSelectedAssessees([...selectedAssessees, assessee.id]);
                                      }
                                    }}
                                  >
                                    {isSelected ? "Selected" : "Select"}
                                  </Button>
                                )}
                              </ListItemSecondaryAction>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Paper>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Or Invite by Email
                  </Typography>

                  <TextField
                    label="Student Email Addresses"
                    fullWidth
                    multiline
                    rows={4}
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    helperText="Enter one or more email addresses, separated by commas"
                  />

                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Students will receive a notification when they log in to the platform.
                  </Typography>
                </Grid>
              </Grid>

              {selectedAssessees.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Students: {selectedAssessees.length}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedAssessees.map(id => {
                      const assessee = registeredAssessees.find(a => a.id === id);
                      return (
                        <Chip
                          key={id}
                          label={assessee ? assessee.name : id}
                          size="small"
                          onDelete={() => setSelectedAssessees(selectedAssessees.filter(selectedId => selectedId !== id))}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenInviteStudents(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInviteStudents}
            disabled={selectedAssessees.length === 0 && !inviteEmails.trim()}
            startIcon={<EmailIcon />}
          >
            Send Invitations
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessorDashboard;

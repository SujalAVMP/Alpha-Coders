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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { getAllTests, createAssessment, getAssessmentById, updateAssessment, inviteStudentsByEmail } from '../../utils/api';

const AssessmentEditor = () => {
  const { assessmentId } = useParams();
  const isNewAssessment = !assessmentId;
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Available tests
  const [availableTests, setAvailableTests] = useState([]);

  // Assessment data state
  const [assessment, setAssessment] = useState({
    title: '',
    description: '',
    tests: [],
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 week from now
    maxAttempts: 1,
    isPublic: false,
    invitedStudents: []
  });

  // Invite students dialog
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');

  // Load assessment data if editing an existing assessment
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch available tests
        const testsData = await getAllTests();
        setAvailableTests(testsData || []);

        if (!isNewAssessment) {
          try {
            // Fetch the assessment data
            const assessmentData = await getAssessmentById(assessmentId);

            // Format dates for the form inputs
            if (assessmentData.startTime) {
              assessmentData.startTime = new Date(assessmentData.startTime).toISOString().slice(0, 16);
            }
            if (assessmentData.endTime) {
              assessmentData.endTime = new Date(assessmentData.endTime).toISOString().slice(0, 16);
            }

            setAssessment(assessmentData);
          } catch (error) {
            console.error('Error fetching assessment:', error);
            setError('Failed to load assessment data. Please try again.');
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, isNewAssessment]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssessment({ ...assessment, [name]: value });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setAssessment({ ...assessment, [name]: checked });
  };

  const handleTestSelection = (testId) => {
    if (assessment.tests.includes(testId)) {
      // Remove test
      setAssessment({
        ...assessment,
        tests: assessment.tests.filter(id => id !== testId)
      });
    } else {
      // Add test
      setAssessment({
        ...assessment,
        tests: [...assessment.tests, testId]
      });
    }
  };

  const handleInviteStudents = async () => {
    if (!inviteEmails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    const emails = inviteEmails.split(',').map(email => email.trim()).filter(email => email);

    try {
      setError('');
      setSaving(true);

      if (isNewAssessment) {
        // For new assessments, just add to the local state since we haven't saved the assessment yet
        const newStudents = emails.map(email => ({
          email,
          status: 'Invited',
          lastAttempt: null
        }));

        setAssessment({
          ...assessment,
          invitedStudents: [...assessment.invitedStudents, ...newStudents]
        });
      } else {
        // For existing assessments, send the invitation through the API
        console.log(`Inviting students to assessment ${assessmentId}:`, emails);
        await inviteStudentsByEmail(assessmentId, emails.join(','));

        // Add to local state as well
        const newStudents = emails.map(email => ({
          email,
          status: 'Invited',
          lastAttempt: null
        }));

        setAssessment({
          ...assessment,
          invitedStudents: [...assessment.invitedStudents, ...newStudents]
        });
      }

      setInviteEmails('');
      setOpenInviteDialog(false);
    } catch (err) {
      console.error('Error inviting students:', err);
      setError('Failed to invite students. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = (email) => {
    setAssessment({
      ...assessment,
      invitedStudents: assessment.invitedStudents.filter(student => student.email !== email)
    });
  };

  const handleSaveAssessment = async () => {
    // Validate required fields
    if (!assessment.title.trim()) {
      setError('Title is required');
      return;
    }

    if (assessment.tests.length === 0) {
      setError('At least one test must be selected');
      return;
    }

    try {
      setSaving(true);
      setError('');

      console.log('Saving assessment:', assessment);

      // Prepare the assessment data
      const assessmentData = {
        ...assessment,
        // Convert dates to ISO strings if they aren't already
        startTime: typeof assessment.startTime === 'string' ? assessment.startTime : assessment.startTime.toISOString(),
        endTime: typeof assessment.endTime === 'string' ? assessment.endTime : assessment.endTime.toISOString()
      };

      if (isNewAssessment) {
        // Create a new assessment
        const result = await createAssessment(assessmentData);
        console.log('Assessment created:', result);
      } else {
        // Update an existing assessment
        const result = await updateAssessment(assessmentId, assessmentData);
        console.log('Assessment updated:', result);
      }

      setSaving(false);
      navigate('/assessments');

    } catch (err) {
      console.error('Error saving assessment:', err);
      setError('Failed to save assessment. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Breadcrumb navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          underline="hover"
        >
          Dashboard
        </Link>
        <Typography color="text.primary">
          {isNewAssessment ? 'Create Assessment' : 'Edit Assessment'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isNewAssessment ? 'Create New Assessment' : 'Edit Assessment'}
        </Typography>

        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveAssessment}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Assessment'}
          </Button>
        </Box>
      </Box>

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
          <Tab label="Basic Information" />
          <Tab label="Tests" />
          <Tab label="Students" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Basic Information Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Title"
                  name="title"
                  value={assessment.title}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={assessment.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Time"
                  name="startTime"
                  type="datetime-local"
                  value={assessment.startTime}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Time"
                  name="endTime"
                  type="datetime-local"
                  value={assessment.endTime}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Maximum Attempts"
                  name="maxAttempts"
                  type="number"
                  value={assessment.maxAttempts}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Assessment Visibility
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={assessment.isPublic}
                        onChange={handleSwitchChange}
                        name="isPublic"
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">Make this assessment public</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {assessment.isPublic ?
                            "This assessment will be visible to all registered users" :
                            "This assessment will only be visible to students you specifically invite"}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tests Tab */}
          {tabValue === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Selected Tests: {assessment.tests.length}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component="a"
                  href="/tests/new"
                  target="_blank"
                >
                  Create New Test
                </Button>
              </Box>

              {availableTests.length === 0 ? (
                <Alert severity="info">
                  No tests available. Please create some tests first.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {availableTests.map((test) => (
                    <Grid item xs={12} sm={6} md={4} key={test._id}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          borderColor: assessment.tests.includes(test._id) ? 'primary.main' : 'inherit',
                          bgcolor: assessment.tests.includes(test._id) ? 'primary.50' : 'inherit'
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {test.title}
                          </Typography>

                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {test.description || 'No description provided'}
                          </Typography>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip
                              label={test.difficulty}
                              size="small"
                              color={
                                test.difficulty === 'Easy' ? 'success' :
                                test.difficulty === 'Medium' ? 'warning' : 'error'
                              }
                            />
                            <Chip
                              label={`${test.timeLimit} min`}
                              size="small"
                              icon={<AccessTimeIcon />}
                            />
                          </Box>
                        </CardContent>

                        <CardActions>
                          <Button
                            size="small"
                            color={assessment.tests.includes(test._id) ? "error" : "primary"}
                            variant={assessment.tests.includes(test._id) ? "contained" : "outlined"}
                            onClick={() => handleTestSelection(test._id)}
                            fullWidth
                          >
                            {assessment.tests.includes(test._id) ? "Remove" : "Add to Assessment"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {/* Students Tab */}
          {tabValue === 2 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Invited Students: {assessment.invitedStudents.length}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  onClick={() => setOpenInviteDialog(true)}
                >
                  Invite Students
                </Button>
              </Box>

              {assessment.invitedStudents.length === 0 ? (
                <Alert severity="info">
                  No students have been invited yet. Click the button above to invite students.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Attempt</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assessment.invitedStudents.map((student) => (
                        <TableRow key={student.email}>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={student.status}
                              size="small"
                              color={
                                student.status === 'Invited' ? 'primary' :
                                student.status === 'Started' ? 'warning' :
                                student.status === 'Completed' ? 'success' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {student.lastAttempt ? new Date(student.lastAttempt).toLocaleString() : 'N/A'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveStudent(student.email)}
                              title="Remove student"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Invite Students Dialog */}
      <Dialog
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Students</DialogTitle>

        <DialogContent dividers>
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
            Students will receive an email invitation with instructions on how to access the assessment.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleInviteStudents}
            disabled={!inviteEmails.trim()}
            startIcon={<EmailIcon />}
          >
            Send Invitations
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentEditor;

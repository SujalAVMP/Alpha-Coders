import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import {
  getMyTests,
  createTest,
  deleteTest,
  getAssessees,
  inviteStudentsByIds,
  inviteStudentsByEmail,
  fetchAPI
} from '../../utils/api';

const AssessorDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [openCreateTest, setOpenCreateTest] = useState(false);
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

  // Invitation states
  const [inviteEmails, setInviteEmails] = useState('');
  const [selectedAssessees, setSelectedAssessees] = useState([]);

  // Fetch tests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch tests created by this assessor
        const testsData = await getMyTests();
        setTests(testsData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          // Make sure we're sending the emails in the format the server expects
          const emailsString = typeof emails === 'string' ? emails : emails.join(',');
          console.log('Sending invitation to emails:', emailsString);

          try {
            const response = await inviteStudentsByEmail(selectedAssessment.id, emailsString);
            console.log('Invitation response:', response);
          } catch (error) {
            console.error('Error inviting by email:', error);
            throw error; // Re-throw to be caught by the outer catch block
          }
        }

        console.log('Successfully invited students');
      } catch (err) {
        console.error('Error inviting students:', err);
        setError('Failed to invite students. Please try again.');
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

  if (loading && tests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', p: 3 }} className="dashboard-container">
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

      {/* Removed My Assessments tab and content */}
      <Paper sx={{ mb: 4 }} className="content-card">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Welcome to the Assessor Dashboard!
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your tests and assessments here.
          </Typography>
        </Box>
      </Paper>
      {/* ...existing code for dialogs, etc... */}
    </Box>
  );
};

export default AssessorDashboard;

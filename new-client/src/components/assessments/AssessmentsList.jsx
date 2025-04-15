import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { getMyAssessments, deleteAssessment, inviteStudentsByEmail } from '../../utils/api';

const AssessmentsList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);

  // Fetch assessments with better error handling
  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching assessments...');
      const data = await getMyAssessments();
      console.log('Fetched assessments:', data);

      // Ensure all assessments have both id and _id properties
      const normalizedAssessments = data.map(assessment => {
        const normalized = { ...assessment };
        if (normalized._id && !normalized.id) {
          normalized.id = normalized._id;
        } else if (normalized.id && !normalized._id) {
          normalized._id = normalized.id;
        }
        return normalized;
      });

      setAssessments(normalizedAssessments);
      console.log('Assessments state set:', normalizedAssessments);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(`Failed to load assessments: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced delete functionality with better error handling
  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) {
      console.error('No assessment selected for deletion');
      return;
    }

    // Ensure we get the correct ID regardless of whether id or _id is used
    const assessmentId = selectedAssessment._id || selectedAssessment.id;

    if (!assessmentId) {
      console.error('Invalid assessment ID for deletion');
      setError('Invalid assessment ID');
      setOpenDeleteDialog(false);
      return;
    }

    try {
      console.log(`Attempting to delete assessment with ID: ${assessmentId}`);
      console.log('Assessment details:', selectedAssessment);

      // Get user email from session storage
      const userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
      console.log('User email for deletion request:', userEmail);

      // Call the delete API
      const response = await deleteAssessment(assessmentId);
      console.log(`Successfully deleted assessment with ID: ${assessmentId}`, response);

      // Remove the deleted assessment from the local state
      setAssessments(prevAssessments =>
        prevAssessments.filter(assessment =>
          (assessment._id !== assessmentId) && (assessment.id !== assessmentId)
        )
      );

      setSuccess('Assessment deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedAssessment(null);

      // Refresh the assessments list after a short delay
      setTimeout(() => {
        fetchAssessments();
      }, 500);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      // Display more specific error message if available
      setError(`Failed to delete assessment: ${err.message || 'Please try again.'}`);
      setOpenDeleteDialog(false);
    }
  };

  // Enhanced invite functionality
  const handleInviteStudents = async () => {
    if (!selectedAssessment) {
      setError('No assessment selected');
      return;
    }

    // Ensure we get the correct ID regardless of whether id or _id is used
    const assessmentId = selectedAssessment._id || selectedAssessment.id;

    if (!assessmentId) {
      setError('Invalid assessment ID');
      setOpenInviteDialog(false);
      return;
    }

    if (!inviteEmails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    try {
      setInviting(true);
      const emailList = inviteEmails.split(',').map(email => email.trim()).filter(email => email);
      const response = await inviteStudentsByEmail(assessmentId, emailList);
      if (response?.success) {
        setSuccess('Invitations sent successfully');
        setOpenInviteDialog(false);
        setSelectedAssessment(null);
        setInviteEmails('');
        await fetchAssessments();
      } else {
        throw new Error(response?.message || 'Failed to send invitations');
      }
    } catch (err) {
      setError(err.message || 'Failed to send invitations. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Dialog openers
  const openDeleteConfirmation = (assessment) => {
    setSelectedAssessment(assessment);
    setOpenDeleteDialog(true);
  };
  const openInviteStudentsDialog = (assessment) => {
    setSelectedAssessment(assessment);
    setOpenInviteDialog(true);
  };

  // Render assessment card actions
  const renderAssessmentActions = (assessment) => {
    if (user?.role !== 'assessor') return null;

    return (
      <>
        <IconButton
          size="small"
          color="primary"
          onClick={() => {
            setSelectedAssessment(assessment);
            setOpenInviteDialog(true);
          }}
          title="Invite Students"
          disabled={loading}
        >
          <PeopleIcon />
        </IconButton>
        <IconButton
          size="small"
          color="primary"
          onClick={() => navigate(`/assessments/${assessment._id}/edit`)}
          title="Edit Assessment"
          disabled={loading}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            setSelectedAssessment(assessment);
            setOpenDeleteDialog(true);
          }}
          title="Delete Assessment"
          disabled={loading}
        >
          <DeleteIcon />
        </IconButton>
      </>
    );
  };

  return (
    <Box className="page-container assessments-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Assessments
        </Typography>
        {user?.role === 'assessor' && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/assessments/new')}
          >
            Create Assessment
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : assessments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No assessments found
          </Typography>
          {user?.role === 'assessor' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/assessments/new')}
              sx={{ mt: 2 }}
            >
              Create Your First Assessment
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assessments.map((assessment) => (
            <Grid key={assessment._id} item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {assessment.title}
                    </Typography>
                    <Chip
                      label={`${assessment.tests?.length || 0} Tests`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {assessment.description || 'No description provided'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Start:</strong> {new Date(assessment.startTime).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End:</strong> {new Date(assessment.endTime).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Max Attempts:</strong> {assessment.maxAttempts || 'Unlimited'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/assessments/${assessment._id}`)}
                    sx={{ mr: 'auto' }}
                  >
                    View Details
                  </Button>
                  {renderAssessmentActions(assessment)}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the assessment "{selectedAssessment?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAssessment} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Students Dialog */}
      <Dialog
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Invite Students</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the email addresses of the students you want to invite to "{selectedAssessment?.title}". Separate multiple emails with commas.
          </DialogContentText>
          <TextField
            autoFocus
            label="Email Addresses"
            fullWidth
            multiline
            rows={4}
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            placeholder="e.g., student@gmail.com, another.student@gmail.com"
            disabled={inviting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)} disabled={inviting}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteStudents}
            color="primary"
            variant="contained"
            disabled={inviting || !inviteEmails.trim()}
          >
            {inviting ? 'Sending...' : 'Send Invitations'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentsList;

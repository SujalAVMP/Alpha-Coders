import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Divider,
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

  // Dialog states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);

  // Fetch assessments on component mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Fetch assessments from API
  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyAssessments();
      console.log('Fetched assessments:', data);
      setAssessments(data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete assessment
  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      await deleteAssessment(selectedAssessment.id);
      setAssessments(assessments.filter(a => a.id !== selectedAssessment.id));
      setSuccess('Assessment deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedAssessment(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting assessment:', err);
      setError('Failed to delete assessment. Please try again.');
      setOpenDeleteDialog(false);
    }
  };

  // Handle invite students
  const handleInviteStudents = async () => {
    if (!selectedAssessment || !inviteEmails.trim()) {
      setError('Please enter at least one email address');
      return;
    }

    try {
      setInviting(true);
      setError('');

      // Send invitation
      await inviteStudentsByEmail(selectedAssessment.id, inviteEmails);

      setSuccess('Invitations sent successfully');
      setOpenInviteDialog(false);
      setSelectedAssessment(null);
      setInviteEmails('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error inviting students:', err);
      setError('Failed to send invitations. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Open delete dialog
  const openDeleteConfirmation = (assessment) => {
    setSelectedAssessment(assessment);
    setOpenDeleteDialog(true);
  };

  // Open invite dialog
  const openInviteStudentsDialog = (assessment) => {
    setSelectedAssessment(assessment);
    setOpenInviteDialog(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          {user?.role === 'assessor' ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/assessments/new')}
              sx={{ mt: 2 }}
            >
              Create Your First Assessment
            </Button>
          ) : (
            <Typography variant="body1" color="textSecondary">
              You haven't been assigned any assessments yet.
            </Typography>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assessments.map((assessment) => (
            <Grid key={assessment.id} style={{ padding: '12px', width: { xs: '100%', md: '50%', lg: '33.33%' } }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {assessment.title}
                    </Typography>
                    <Chip
                      label={assessment.tests?.length === 1 ? '1 Test' : `${assessment.tests?.length || 0} Tests`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {assessment.description || 'No description provided'}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

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
                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                    sx={{ mr: 'auto' }}
                  >
                    View Details
                  </Button>

                  {user?.role === 'assessor' && (
                    <>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openInviteStudentsDialog(assessment)}
                        title="Invite Students"
                      >
                        <PeopleIcon />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/assessments/${assessment.id}/edit`)}
                        title="Edit Assessment"
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteConfirmation(assessment)}
                        title="Delete Assessment"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
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
    </Container>
  );
};

export default AssessmentsList;

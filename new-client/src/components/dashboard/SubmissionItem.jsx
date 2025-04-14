import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { deleteSubmission } from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const SubmissionItem = ({ submission, onDelete }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleDeleteSubmission = async () => {
    try {
      setLoading(true);
      setError('');
      await deleteSubmission(submission._id);
      setSuccess(true);
      setTimeout(() => {
        setOpenDialog(false);
        if (onDelete) {
          onDelete(submission._id);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete submission');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 2,
          mb: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {submission.test.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                label={submission.language} 
                size="small"
                color="primary"
                variant="outlined"
              />
              
              <Chip 
                label={submission.status} 
                size="small"
                color={
                  submission.status === 'Accepted' ? 'success' : 
                  submission.status === 'Wrong Answer' ? 'error' : 'warning'
                }
              />
              
              <Typography variant="body2" color="text.secondary">
                {formatDate(submission.submittedAt)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                <strong>Test Cases:</strong> {submission.testCasesPassed}/{submission.totalTestCases}
              </Typography>
              
              <Typography variant="body2">
                <strong>Time:</strong> {submission.executionTime} ms
              </Typography>
              
              <Typography variant="body2">
                <strong>Memory:</strong> {submission.memoryUsed} MB
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
            <Button
              variant="outlined"
              size="small"
              component={RouterLink}
              to={`/submissions/${submission._id}`}
              startIcon={<VisibilityIcon />}
            >
              View
            </Button>
            
            <IconButton 
              color="error" 
              size="small"
              onClick={handleOpenDialog}
              sx={{ ml: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      
      {/* Delete Submission Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="delete-submission-dialog-title"
        aria-describedby="delete-submission-dialog-description"
      >
        <DialogTitle id="delete-submission-dialog-title" sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1 }} />
          Delete Submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-submission-dialog-description">
            Are you sure you want to delete this submission for <strong>{submission.test.title}</strong>? This action cannot be undone.
          </DialogContentText>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Submission deleted successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} disabled={loading || success}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteSubmission} 
            color="error" 
            variant="contained"
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SubmissionItem;

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Avatar,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  VpnKey as VpnKeyIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const Profile = () => {
  const { user, deleteAccount, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
    setConfirmText('');
    setDeleteError('');
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleConfirmTextChange = (e) => {
    setConfirmText(e.target.value);
  };
  
  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    
    try {
      await deleteAccount();
      setDeleteSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account');
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
  
  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ pt: 4, pb: 8 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Your Profile
        </Typography>
        
        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 0, borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, px: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Account Information
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        bgcolor: 'primary.main',
                        fontSize: '3rem'
                      }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        NAME
                      </Typography>
                      <Typography variant="h6" fontWeight={500}>
                        {user?.name || 'User'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        EMAIL
                      </Typography>
                      <Typography variant="h6" fontWeight={500}>
                        {user?.email || 'user@example.com'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <VpnKeyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        ACCOUNT TYPE
                      </Typography>
                      <Typography variant="h6" fontWeight={500}>
                        {user?.role || 'User'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          
          {/* Danger Zone */}
          <Grid item xs={12}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 0, 
                borderRadius: 3, 
                overflow: 'hidden',
                borderLeft: 4,
                borderColor: 'error.main'
              }}
            >
              <Box sx={{ bgcolor: 'error.50', py: 2, px: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="error.main">
                  Danger Zone
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      Delete Your Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Once you delete your account, there is no going back. This action cannot be undone.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleOpenDialog}
                    >
                      Delete Account
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Delete Account Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          aria-labelledby="delete-account-dialog-title"
          aria-describedby="delete-account-dialog-description"
        >
          <DialogTitle id="delete-account-dialog-title" sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
            <WarningIcon sx={{ mr: 1 }} />
            Delete Account
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-account-dialog-description">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogContentText>
            
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
            
            {deleteSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Your account has been deleted successfully. Redirecting...
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              id="confirm"
              label="Type DELETE to confirm"
              type="text"
              fullWidth
              variant="outlined"
              value={confirmText}
              onChange={handleConfirmTextChange}
              sx={{ mt: 2 }}
              disabled={deleteSuccess}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} disabled={deleteSuccess}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAccount} 
              color="error" 
              variant="contained"
              disabled={confirmText !== 'DELETE' || deleteSuccess}
            >
              {loading ? <CircularProgress size={24} /> : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Profile;

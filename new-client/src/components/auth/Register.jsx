import React, { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'assessee'
  });
  const [formError, setFormError] = useState('');
  const { registerUser, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, role } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await registerUser({ name, email, password, role });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      // Error is handled in AuthContext
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Sign Up
          </Typography>

          {(error || formError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={onChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={onChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={onChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
            />

            <FormControl component="fieldset" sx={{ mt: 3, width: '100%', border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Select Your Role</FormLabel>
              <RadioGroup
                name="role"
                value={role}
                onChange={onChange}
                sx={{ mt: 1 }}
              >
                <FormControlLabel
                  value="assessee"
                  control={<Radio color="primary" />}
                  label={
                    <Box>
                      <Typography variant="subtitle1">Assessee</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Take coding tests and assessments, submit solutions, and track your progress.
                      </Typography>
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  value="assessor"
                  control={<Radio color="primary" />}
                  label={
                    <Box>
                      <Typography variant="subtitle1">Assessor</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create coding tests, manage assessments, and evaluate submissions.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign Up
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login">
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;

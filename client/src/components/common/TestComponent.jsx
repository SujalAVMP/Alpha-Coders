import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid
} from '@mui/material';

const API_URL = 'http://localhost:5002/api';

const TestComponent = () => {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/test`);
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    try {
      setLoading(true);
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      localStorage.setItem('token', data.token);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async () => {
    try {
      setLoading(true);
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
      localStorage.setItem('token', data.token);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/tests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          API Test
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Button
              variant="contained"
              onClick={testApi}
              disabled={loading}
            >
              Test API
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={registerUser}
              disabled={loading}
            >
              Register User
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={loginUser}
              disabled={loading}
            >
              Login User
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              onClick={getTests}
              disabled={loading}
            >
              Get Tests
            </Button>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>
          Output:
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            minHeight: '200px'
          }}
        >
          {output || 'Click a button to test the API'}
        </Paper>
      </Paper>
    </Container>
  );
};

export default TestComponent;

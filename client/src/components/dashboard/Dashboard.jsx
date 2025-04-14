import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAllTests, getUserSubmissions } from '../../utils/api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...');
        const [testsRes, submissionsRes] = await Promise.all([
          getAllTests(),
          getUserSubmissions()
        ]);

        console.log('Tests response:', testsRes.data);
        console.log('Submissions response:', submissionsRes.data);

        setTests(testsRes.data);
        setSubmissions(submissionsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}
      </Typography>

      <Grid container spacing={3}>
        {/* Recent Tests */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Available Tests
              </Typography>
              <Button component={Link} to="/tests" size="small">
                View all
              </Button>
            </Box>
            <Divider />

            {tests.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No tests available
                </Typography>
              </Box>
            ) : (
              <List sx={{ overflow: 'auto', maxHeight: 160 }}>
                {tests.slice(0, 5).map((test) => (
                  <ListItem
                    key={test._id}
                    button
                    component={Link}
                    to={`/tests/${test._id}`}
                  >
                    <ListItemText
                      primary={test.title}
                      secondary={`Difficulty: ${test.difficulty}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Submissions */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Recent Submissions
              </Typography>
              <Button component={Link} to="/submissions" size="small">
                View all
              </Button>
            </Box>
            <Divider />

            {submissions.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No submissions yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ overflow: 'auto', maxHeight: 160 }}>
                {submissions.slice(0, 5).map((submission) => (
                  <ListItem
                    key={submission._id}
                    button
                    component={Link}
                    to={`/submissions/${submission._id}`}
                  >
                    <ListItemText
                      primary={submission.test.title}
                      secondary={`Status: ${submission.status} | ${new Date(submission.submittedAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  component={Link}
                  to="/tests"
                  variant="contained"
                  fullWidth
                >
                  Browse Tests
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  component={Link}
                  to="/submissions"
                  variant="outlined"
                  fullWidth
                >
                  View Submissions
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  component={Link}
                  to="/profile"
                  variant="outlined"
                  fullWidth
                >
                  Edit Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getUserSubmissions } from '../../utils/api';
import SubmissionItem from './SubmissionItem';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SubmissionsList = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getUserSubmissions();
        setSubmissions(data);
        setFilteredSubmissions(data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = submissions;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(submission =>
        submission.test.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(submission => submission.status === statusFilter);
    }

    setFilteredSubmissions(result);
  }, [searchTerm, statusFilter, submissions]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

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

  const handleDeleteSubmission = (submissionId) => {
    setSubmissions(prevSubmissions => prevSubmissions.filter(sub => sub._id !== submissionId));
    setFilteredSubmissions(prevFilteredSubmissions => prevFilteredSubmissions.filter(sub => sub._id !== submissionId));
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error loading submissions
          </Typography>
          <Typography>{error}</Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box className="page-container submissions-container">
      <Typography variant="h4" gutterBottom>
        Your Submissions
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }} className="content-card">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            label="Search by Test Title"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Accepted">Accepted</MenuItem>
              <MenuItem value="Wrong Answer">Wrong Answer</MenuItem>
              <MenuItem value="Time Limit Exceeded">Time Limit Exceeded</MenuItem>
              <MenuItem value="Runtime Error">Runtime Error</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filteredSubmissions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No submissions found matching your criteria.
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredSubmissions.map((submission) => (
              <SubmissionItem
                key={submission._id}
                submission={submission}
                onDelete={handleDeleteSubmission}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SubmissionsList;

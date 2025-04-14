/**
 * Main server file for the Coding Platform
 */

const express = require('express');
const cors = require('cors');
const { initializeData } = require('./models/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const submissionRoutes = require('./routes/submissions');
const assessmentRoutes = require('./routes/assessments');

// Initialize the server
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/assessments', assessmentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Coding Platform API' });
});

// Initialize sample data
initializeData();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

/**
 * Main server file for the Coding Platform
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const submissionRoutes = require('./routes/submissions');
const assessmentRoutes = require('./routes/assessments');

// Initialize the server
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/assessments', assessmentRoutes);

// Direct delete assessment endpoint
app.delete('/api/direct/assessments/:id', async (req, res) => {
  try {
    const { Assessment, Submission, Notification } = require('./models/db');
    const mongoose = require('mongoose');
    const assessmentId = req.params.id;
    console.log('DELETE /api/direct/assessments/:id - Assessment ID:', assessmentId);

    // Get the user from the request
    let userEmail = req.query.email;
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
    }
    console.log('User email for deletion:', userEmail);

    // Find the user
    const User = require('./models/User');
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error('User not found with email:', userEmail);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Found user for deletion:', user._id, user.email, user.role);

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.error('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ message: 'Assessment not found' });
    }
    console.log('Found assessment for deletion:', assessment._id, assessment.title);

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === user._id.toString();
    console.log('Assessment creator check:', {
      isCreator,
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      userId: user._id.toString()
    });

    // For testing purposes, we'll allow any assessor to delete assessments
    // In a production environment, you would enforce the creator check
    if (user.role !== 'assessor') {
      console.error('User is not an assessor:', user.role);
      return res.status(403).json({ message: 'Access denied. Only assessors can delete assessments.' });
    }

    console.log('Deleting assessment:', assessmentId);

    try {
      // First, delete all submissions related to this assessment
      console.log('Deleting submissions for assessment:', assessmentId);
      const deletedSubmissions = await Submission.deleteMany({
        $or: [
          { assessment: assessmentId },
          { assessmentId: assessmentId }
        ]
      });
      console.log('Related submissions deleted:', deletedSubmissions);

      // Delete any notifications related to this assessment
      console.log('Deleting notifications for assessment:', assessmentId);
      const deletedNotifications = await Notification.deleteMany({
        $or: [
          { assessment: assessmentId },
          { assessmentId: assessmentId }
        ]
      });
      console.log('Related notifications deleted:', deletedNotifications);

      // Now delete the assessment
      console.log('Deleting assessment with ID:', assessmentId);
      const deletedAssessment = await Assessment.findByIdAndDelete(assessmentId);

      if (!deletedAssessment) {
        console.error('Assessment not found during deletion attempt');
        return res.status(404).json({ message: 'Assessment not found during deletion' });
      }

      console.log('Assessment deleted successfully:', deletedAssessment._id);

      res.json({
        message: 'Assessment deleted successfully',
        deletedAssessment: {
          id: deletedAssessment._id,
          title: deletedAssessment.title
        }
      });
    } catch (deleteError) {
      console.error('Error during deletion process:', deleteError);
      return res.status(500).json({
        message: 'Error during deletion process',
        error: deleteError.message,
        stack: deleteError.stack
      });
    }
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Coding Platform API' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

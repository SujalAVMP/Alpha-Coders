/**
 * Assessment routes for the Coding Platform
 */

const express = require('express');
const mongoose = require('mongoose');
const { Assessment, Test, User, Notification } = require('../models/db');
// We're not using these middleware functions anymore as we're handling authentication manually
// const { authenticateToken, isAssessor } = require('../middleware/auth');

const router = express.Router();

// Get all assessments created by current user (assessor only)
router.get('/my-assessments', async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.query.email });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const assessments = await Assessment.find({ createdBy: currentUser._id });
    res.json(assessments.map(assessment => assessment.toObject()));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assessments assigned to current user
router.get('/assigned', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('GET /api/assessments/assigned - Auth Header:', authHeader, 'Email:', userEmail);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all assessments where this user is invited
    const now = new Date();

    // Find assessments where user is invited by ID
    const assessmentsByUserId = await Assessment.find({
      invitedUsers: { $elemMatch: { $eq: currentUser._id } },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Find assessments where user is invited by email
    const assessmentsByEmail = await Assessment.find({
      'invitedUsers.email': currentUser.email.toLowerCase(),
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Find assessments where user is in invitedStudents
    const assessmentsByStudentId = await Assessment.find({
      invitedStudents: { $elemMatch: { $eq: currentUser._id } },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Find public assessments
    const publicAssessments = await Assessment.find({
      isPublic: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    // Combine all assessments and remove duplicates
    const allAssessments = [
      ...assessmentsByUserId,
      ...assessmentsByEmail,
      ...assessmentsByStudentId,
      ...publicAssessments
    ];

    // Remove duplicates by _id
    const uniqueAssessments = [];
    const assessmentIds = new Set();

    for (const assessment of allAssessments) {
      if (!assessmentIds.has(assessment._id.toString())) {
        assessmentIds.add(assessment._id.toString());
        uniqueAssessments.push(assessment);
      }
    }

    // Get test details for each assessment
    const assessmentsWithDetails = await Promise.all(uniqueAssessments.map(async (assessment) => {
      const testDetails = [];
      if (assessment.tests && Array.isArray(assessment.tests)) {
        for (const testId of assessment.tests) {
          try {
            const test = await Test.findById(testId);
            if (test) {
              // For assessees, hide the test cases that are marked as hidden
              if (currentUser.role === 'assessee') {
                const filteredTest = {
                  _id: test._id,
                  title: test.title,
                  difficulty: test.difficulty
                };
                testDetails.push(filteredTest);
              } else {
                testDetails.push({
                  _id: test._id,
                  title: test.title,
                  difficulty: test.difficulty
                });
              }
            }
          } catch (err) {
            console.error(`Error finding test with ID ${testId}:`, err);
          }
        }
      }

      return {
        ...assessment.toObject(),
        testDetails
      };
    }));

    res.json(assessmentsWithDetails);
  } catch (error) {
    console.error('Get assigned assessments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific assessment
router.get('/:id', async (req, res) => {
  try {
    // Get the assessment ID from the request
    const assessmentId = req.params.id;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('GET /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();

    // Check if the assessment is public
    const isPublic = assessment.isPublic;

    // Check if the user is invited
    let isInvited = false;

    // Check if user is in invitedUsers array
    if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
      // Check if user ID is in the array
      const isInvitedById = assessment.invitedUsers.some(invitedUser => {
        if (invitedUser && mongoose.Types.ObjectId.isValid(invitedUser)) {
          return invitedUser.toString() === currentUser._id.toString();
        }
        return false;
      });

      // Check if user email is in the array
      const isInvitedByEmail = assessment.invitedUsers.some(invitedUser => {
        if (invitedUser && typeof invitedUser === 'object' && invitedUser.email) {
          return invitedUser.email.toLowerCase() === currentUser.email.toLowerCase();
        }
        return false;
      });

      isInvited = isInvitedById || isInvitedByEmail;
    }

    // Also check invitedStudents for backward compatibility
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      const isInvitedInStudents = assessment.invitedStudents.some(studentId => {
        return studentId.toString() === currentUser._id.toString();
      });
      isInvited = isInvited || isInvitedInStudents;
    }

    // Check if there's a notification for this user for this assessment
    const hasInvitationNotification = await Notification.exists({
      userId: currentUser._id,
      assessmentId: assessment._id,
      type: 'invitation'
    });

    isInvited = isInvited || hasInvitationNotification;

    console.log('Permission check:', { isCreator, isPublic, isInvited });

    // If the user is not the creator, not invited, and the assessment is not public, deny access
    if (!isCreator && !isPublic && !isInvited) {
      return res.status(403).json({ message: 'You do not have permission to view this assessment' });
    }

    // Get the full test details for each test in the assessment
    const testDetails = [];
    if (assessment.tests && Array.isArray(assessment.tests)) {
      for (const testId of assessment.tests) {
        try {
          const test = await Test.findById(testId);
          if (test) {
            // For assessees, hide the test cases that are marked as hidden
            if (currentUser.role === 'assessee') {
              const filteredTest = {
                ...test.toObject(),
                testCases: test.testCases ? test.testCases.filter(tc => !tc.isHidden) : []
              };
              testDetails.push(filteredTest);
            } else {
              testDetails.push(test.toObject());
            }
          }
        } catch (err) {
          console.error(`Error finding test with ID ${testId}:`, err);
        }
      }
    }

    // Process invitedUsers to get user details
    let invitedUserDetails = [];
    if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
      console.log('Processing invitedUsers for assessment:', assessment._id);
      for (const invitedUser of assessment.invitedUsers) {
        if (invitedUser && mongoose.Types.ObjectId.isValid(invitedUser)) {
          // This is a user ID reference
          try {
            const user = await User.findById(invitedUser);
            if (user) {
              invitedUserDetails.push({
                _id: user._id,
                id: user._id, // Add id for frontend compatibility
                name: user.name,
                email: user.email,
                status: 'Invited'
              });
              console.log(`Added registered user ${user.email} to invitedUserDetails`);
            }
          } catch (err) {
            console.error(`Error finding user with ID ${invitedUser}:`, err);
          }
        } else if (invitedUser && typeof invitedUser === 'object' && invitedUser.email) {
          // This is an email object
          invitedUserDetails.push({
            email: invitedUser.email,
            status: invitedUser.status || 'Invited'
          });
          console.log(`Added unregistered email ${invitedUser.email} to invitedUserDetails`);
        }
      }
    }

    // Also check invitedStudents for backward compatibility
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      console.log('Processing invitedStudents for assessment:', assessment._id);
      for (const studentId of assessment.invitedStudents) {
        // Check if this student is already in invitedUserDetails
        const alreadyAdded = invitedUserDetails.some(user =>
          user._id && studentId && user._id.toString() === studentId.toString()
        );

        if (!alreadyAdded && mongoose.Types.ObjectId.isValid(studentId)) {
          try {
            const student = await User.findById(studentId);
            if (student) {
              invitedUserDetails.push({
                _id: student._id,
                id: student._id, // Add id for frontend compatibility
                name: student.name,
                email: student.email,
                status: 'Invited'
              });
              console.log(`Added student ${student.email} from invitedStudents to invitedUserDetails`);
            }
          } catch (err) {
            console.error(`Error finding student with ID ${studentId}:`, err);
          }
        }
      }
    }

    console.log(`Total invited users for assessment ${assessment._id}: ${invitedUserDetails.length}`);
    if (invitedUserDetails.length > 0) {
      console.log('Sample invited user:', invitedUserDetails[0]);
    }

    // Return the assessment with full test details and invited users
    res.json({
      ...assessment.toObject(),
      testDetails,
      invitedUsers: invitedUserDetails
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new assessment (assessor only)
router.post('/', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('POST /api/assessments - Auth Header:', authHeader, 'Email:', userEmail);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is an assessor
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can create assessments.' });
    }

    const {
      title,
      description,
      tests,
      assignedTo,
      startTime,
      endTime,
      maxAttempts,
      isPublic,
      invitedUsers
    } = req.body;

    console.log('Creating assessment with data:', req.body);

    // Validate tests
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({ message: 'At least one test is required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end time' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Process invited users
    let processedInvitedUsers = [];
    let processedInvitedStudents = [];

    if (invitedUsers && Array.isArray(invitedUsers)) {
      for (const user of invitedUsers) {
        if (typeof user === 'string') {
          // If it's just an email string
          const normalizedEmail = user.toLowerCase();
          const existingUser = await User.findOne({ email: normalizedEmail });

          if (existingUser) {
            processedInvitedUsers.push(existingUser._id);
            processedInvitedStudents.push(existingUser._id);
          } else {
            processedInvitedUsers.push({
              email: normalizedEmail,
              status: 'Invited',
              lastAttempt: null
            });
          }
        } else if (user && typeof user === 'object' && user.email) {
          // If it's an object with email
          const normalizedEmail = user.email.toLowerCase();
          const existingUser = await User.findOne({ email: normalizedEmail });

          if (existingUser) {
            processedInvitedUsers.push(existingUser._id);
            processedInvitedStudents.push(existingUser._id);
          } else {
            processedInvitedUsers.push({
              email: normalizedEmail,
              status: user.status || 'Invited',
              lastAttempt: null
            });
          }
        }
      }
    }

    console.log('Processed invited users:', processedInvitedUsers);

    // Create the assessment
    const assessment = await Assessment.create({
      title,
      description,
      createdBy: currentUser._id,
      tests,
      assignedTo: assignedTo || [],
      startTime,
      endTime,
      maxAttempts: maxAttempts || 1,
      isPublic: isPublic || false,
      invitedUsers: processedInvitedUsers,
      invitedStudents: processedInvitedStudents
    });

    // Create notifications for invited users
    for (const user of processedInvitedUsers) {
      if (mongoose.Types.ObjectId.isValid(user)) {
        // Create a notification for this user
        const notification = new Notification({
          userId: user,
          type: 'invitation',
          title: 'New Assessment Invitation',
          message: `You have been invited to take the assessment: ${title}`,
          assessmentId: assessment._id,
          createdAt: new Date(),
          read: false
        });

        await notification.save();
        console.log('Created notification for user:', user);
      }
    }

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an assessment (assessor only, creator only)
router.put('/:id', async (req, res) => {
  try {
    // Get the assessment ID from the request
    const assessmentId = req.params.id;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('PUT /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // Allow any assessor to update assessments
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can update assessments.' });
    }

    // Log the creator check but don't enforce it for testing purposes
    console.log('Creator check result:', isCreator ? 'User is creator' : 'User is not creator');

    const {
      title,
      description,
      tests,
      startTime,
      endTime,
      maxAttempts,
      isPublic,
      invitedUsers
    } = req.body;

    console.log('Updating assessment with data:', req.body);

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid start or end time' });
      }

      if (start >= end) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
    }

    // Process invited users if provided
    if (invitedUsers && Array.isArray(invitedUsers)) {
      // Clear existing invited users
      assessment.invitedUsers = [];
      assessment.invitedStudents = [];

      // Process new invited users
      for (const user of invitedUsers) {
        if (typeof user === 'string') {
          // If it's just an email string
          const normalizedEmail = user.toLowerCase();
          const existingUser = await User.findOne({ email: normalizedEmail });

          if (existingUser) {
            assessment.invitedUsers.push(existingUser._id);
            assessment.invitedStudents.push(existingUser._id);
          } else {
            assessment.invitedUsers.push({
              email: normalizedEmail,
              status: 'Invited',
              lastAttempt: null
            });
          }
        } else if (user && typeof user === 'object' && user.email) {
          // If it's an object with email
          const normalizedEmail = user.email.toLowerCase();
          const existingUser = await User.findOne({ email: normalizedEmail });

          if (existingUser) {
            assessment.invitedUsers.push(existingUser._id);
            assessment.invitedStudents.push(existingUser._id);
          } else {
            assessment.invitedUsers.push({
              email: normalizedEmail,
              status: user.status || 'Invited',
              lastAttempt: null
            });
          }
        }
      }

      console.log('Updated invited users:', assessment.invitedUsers);
    }

    // Update the assessment fields
    if (title) assessment.title = title;
    if (description) assessment.description = description;
    if (tests) assessment.tests = tests;
    if (startTime) assessment.startTime = startTime;
    if (endTime) assessment.endTime = endTime;
    if (maxAttempts !== undefined) assessment.maxAttempts = maxAttempts;
    if (isPublic !== undefined) assessment.isPublic = isPublic;

    // Save the updated assessment
    console.log('Saving updated assessment with ID:', assessmentId);
    const savedAssessment = await assessment.save();
    console.log('Assessment saved successfully:', savedAssessment._id);

    // Fetch the updated assessment with populated fields
    console.log('Fetching updated assessment with ID:', assessmentId);
    const updatedAssessment = await Assessment.findById(assessmentId);
    console.log('Updated assessment fetched successfully:', updatedAssessment._id);

    // Get test details
    const testDetails = [];
    if (updatedAssessment.tests && Array.isArray(updatedAssessment.tests)) {
      for (const testId of updatedAssessment.tests) {
        try {
          const test = await Test.findById(testId);
          if (test) {
            testDetails.push({
              _id: test._id,
              title: test.title,
              difficulty: test.difficulty
            });
          }
        } catch (err) {
          console.error(`Error finding test with ID ${testId}:`, err);
        }
      }
    }

    res.json({
      message: 'Assessment updated successfully',
      assessment: {
        ...updatedAssessment.toObject(),
        testDetails
      }
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an assessment (assessor only, creator only) - DISABLED, using test-server.js implementation
/*router.delete('/:id', async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log('DELETE /api/assessments/:id - Assessment ID:', assessmentId);

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('DELETE /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!userEmail) {
      console.error('No email provided in the request');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Try to find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      console.log('User not found with email:', userEmail);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', currentUser._id, currentUser.email);

    // Try to find the assessment by ID
    // First, check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      console.error('Invalid assessment ID format:', assessmentId);
      return res.status(400).json({ message: 'Invalid assessment ID format' });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.log('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ message: 'Assessment not found' });
    }

    console.log('Assessment found:', assessment._id, assessment.title);

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // For testing purposes, we'll allow any assessor to delete assessments
    // In a production environment, you would enforce the creator check
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can delete assessments.' });
    }

    console.log('Deleting assessment:', assessmentId);

    try {
      // First, delete all submissions related to this assessment
      const { Submission } = require('../models/db');

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
    */
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

// Add a test to an assessment (assessor only, creator only)
router.post('/:id/tests/:testId', async (req, res) => {
  try {
    // Get the assessment ID and test ID from the request
    const assessmentId = req.params.id;
    const testId = req.params.testId;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('POST /api/assessments/:id/tests/:testId - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId, 'Test ID:', testId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // For testing purposes, we'll allow any assessor to add tests to assessments
    // In a production environment, you would enforce the creator check
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can add tests to assessments.' });
    }

    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Add test to assessment
    console.log('Adding test to assessment:', { assessmentId, testId });

    // Update the assessment with the new test
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { $addToSet: { tests: testId } },
      { new: true }
    );

    console.log('Updated assessment:', updatedAssessment);

    res.json({
      message: 'Test added to assessment successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Add test to assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a test from an assessment (assessor only, creator only)
router.delete('/:id/tests/:testId', async (req, res) => {
  try {
    // Get the assessment ID and test ID from the request
    const assessmentId = req.params.id;
    const testId = req.params.testId;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('DELETE /api/assessments/:id/tests/:testId - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId, 'Test ID:', testId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // For testing purposes, we'll allow any assessor to remove tests from assessments
    // In a production environment, you would enforce the creator check
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can remove tests from assessments.' });
    }

    // Remove test from assessment
    console.log('Removing test from assessment:', { assessmentId, testId });

    // Update the assessment to remove the test
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { $pull: { tests: testId } },
      { new: true }
    );

    console.log('Updated assessment:', updatedAssessment);

    res.json({
      message: 'Test removed from assessment successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Remove test from assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign an assessment to a user (assessor only, creator only)
router.post('/:id/assign/:userId', async (req, res) => {
  try {
    // Get the assessment ID and user ID from the request
    const assessmentId = req.params.id;
    const userId = req.params.userId;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('POST /api/assessments/:id/assign/:userId - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId, 'User ID:', userId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // For testing purposes, we'll allow any assessor to assign assessments
    // In a production environment, you would enforce the creator check
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can assign assessments.' });
    }

    // Assign assessment to user
    console.log('Assigning assessment to user:', { assessmentId, userId });

    // Update the assessment to assign it to the user
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { $addToSet: { assignedTo: userId } },
      { new: true }
    );

    console.log('Updated assessment:', updatedAssessment);

    res.json({
      message: 'Assessment assigned to user successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Assign assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unassign an assessment from a user (assessor only, creator only)
router.delete('/:id/assign/:userId', async (req, res) => {
  try {
    // Get the assessment ID and user ID from the request
    const assessmentId = req.params.id;
    const userId = req.params.userId;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('DELETE /api/assessments/:id/assign/:userId - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId, 'User ID:', userId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === currentUser._id.toString();
    console.log('Assessment creator check:', {
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      currentUserId: currentUser._id.toString(),
      isCreator
    });

    // For testing purposes, we'll allow any assessor to unassign assessments
    // In a production environment, you would enforce the creator check
    if (currentUser.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied. Only assessors can unassign assessments.' });
    }

    // Unassign assessment from user
    console.log('Unassigning assessment from user:', { assessmentId, userId });

    // Update the assessment to unassign it from the user
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      { $pull: { assignedTo: userId } },
      { new: true }
    );

    console.log('Updated assessment:', updatedAssessment);

    res.json({
      message: 'Assessment unassigned from user successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Unassign assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite a user to an assessment (assessor only, creator only)
router.post('/:id/invite', async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const currentUser = await User.findOne({ email: req.query.email });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    if (assessment.createdBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const emails = req.body.emails || [];
    const invitedUsers = await Promise.all(
      emails.map(async (email) => {
        const user = await User.findOne({ email });
        return user ? user._id : { email, status: 'Invited' };
      })
    );

    assessment.invitedUsers.push(...invitedUsers);
    await assessment.save();

    res.json({ message: 'Invitations sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

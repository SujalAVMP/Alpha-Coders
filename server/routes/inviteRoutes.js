const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const Notification = require('../models/Notification');

// Invite a user to an assessment
router.post('/:id/invite', async (req, res) => {
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

    console.log('POST /api/assessments/:id/invite - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

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
    console.log('Assessment creator check:', { isCreator });

    // Enforce creator check
    if (!isCreator) {
      return res.status(403).json({ message: 'You do not have permission to invite users to this assessment' });
    }

    // Get the emails from the request body
    const { emails, userIds } = req.body;

    console.log('Invitation request:', { emails, userIds });

    // Initialize counters for response
    let invitedCount = 0;
    let emailsCount = 0;
    const notFoundEmails = [];

    // Initialize the invitedUsers and invitedStudents arrays if they don't exist
    if (!assessment.invitedUsers) {
      assessment.invitedUsers = [];
    }
    if (!assessment.invitedStudents) {
      assessment.invitedStudents = [];
    }

    // Process emails if provided
    if (emails) {
      // Handle both comma-separated string and array formats
      const emailList = typeof emails === 'string'
        ? emails.split(',').map(e => e.trim()).filter(e => e)
        : Array.isArray(emails) ? emails : [emails];

      console.log('Processing email list:', emailList);

      for (const email of emailList) {
        // Normalize email to lowercase for case-insensitive comparison
        const normalizedEmail = email.toLowerCase();

        // Check if this email is already in the invitedUsers array
        const alreadyInvited = assessment.invitedUsers.some(user => {
          if (typeof user === 'object' && user.email) {
            return user.email.toLowerCase() === normalizedEmail;
          }
          return false;
        });

        if (alreadyInvited) {
          console.log(`Email ${normalizedEmail} already invited, skipping`);
          continue;
        }

        // Find the user with this email
        const invitedUser = await User.findOne({ email: normalizedEmail });

        if (invitedUser) {
          // Add the user to the invited users list
          console.log('Found user for email:', email, invitedUser._id);

          // Check if user is already invited by ID
          const userAlreadyInvited = assessment.invitedUsers.some(u => {
            if (u && (u._id || u.toString)) {
              const uId = u._id ? u._id.toString() : u.toString();
              return uId === invitedUser._id.toString();
            }
            return false;
          });

          if (!userAlreadyInvited) {
            // Add user reference to invitedUsers and invitedStudents
            assessment.invitedUsers.push(invitedUser._id);
            assessment.invitedStudents.push(invitedUser._id);
            invitedCount++;

            // Create a notification for this user
            const notification = new Notification({
              userId: invitedUser._id,
              type: 'invitation',
              title: 'New Assessment Invitation',
              message: `You have been invited to take the assessment: ${assessment.title}`,
              assessmentId: assessment._id,
              createdAt: new Date(),
              read: false
            });

            await notification.save();
            console.log('Created notification for user:', invitedUser._id);
          }
        } else {
          // For emails that don't match any registered user, store the email directly
          console.log('User not found for email, storing email object:', email);

          // Add email object to invitedUsers
          assessment.invitedUsers.push({
            email: normalizedEmail,
            status: 'Invited',
            lastAttempt: null
          });
          emailsCount++;
          notFoundEmails.push(normalizedEmail);
        }
      }
    }

    // Process userIds if provided
    if (userIds && Array.isArray(userIds)) {
      console.log('Processing user IDs:', userIds);

      for (const userId of userIds) {
        // Check if user is already invited
        const userAlreadyInvited = assessment.invitedUsers.some(u => {
          if (u && (u._id || u.toString)) {
            const uId = u._id ? u._id.toString() : u.toString();
            return uId === userId.toString();
          }
          return false;
        });

        if (!userAlreadyInvited) {
          // Find the user to ensure they exist
          const user = await User.findById(userId);

          if (user) {
            // Add user reference to invitedUsers and invitedStudents
            assessment.invitedUsers.push(user._id);
            assessment.invitedStudents.push(user._id);
            invitedCount++;

            // Create a notification for this user
            const notification = new Notification({
              userId: user._id,
              type: 'invitation',
              title: 'New Assessment Invitation',
              message: `You have been invited to take the assessment: ${assessment.title}`,
              assessmentId: assessment._id,
              createdAt: new Date(),
              read: false
            });

            await notification.save();
            console.log('Created notification for user by ID:', user._id);
          }
        }
      }
    }

    // Save the updated assessment
    await assessment.save();

    console.log('Updated invitedUsers count:', assessment.invitedUsers.length);
    console.log('Updated invitedStudents count:', assessment.invitedStudents.length);

    // Return success response
    res.json({
      message: 'Students invited successfully',
      invitedCount,
      emailsCount,
      notFoundEmails,
      success: true
    });
  } catch (error) {
    console.error('Error inviting user to assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

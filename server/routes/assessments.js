/**
 * Assessment routes for the Coding Platform
 */

const express = require('express');
const { Assessment, Test } = require('../models/db');
const { authenticateToken, isAssessor } = require('../middleware/auth');

const router = express.Router();

// Get all assessments created by current user (assessor only)
router.get('/my-assessments', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessments = await Assessment.getByCreator(req.user.id);
    res.json(assessments);
  } catch (error) {
    console.error('Get my assessments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all assessments assigned to current user
router.get('/assigned', authenticateToken, async (req, res) => {
  try {
    const assessments = await Assessment.getByAssignee(req.user.id);
    
    // Filter out assessments that haven't started or have ended
    const now = new Date();
    const activeAssessments = assessments.filter(a => {
      const startTime = new Date(a.startTime);
      const endTime = new Date(a.endTime);
      return startTime <= now && endTime >= now;
    });
    
    res.json(activeAssessments);
  } catch (error) {
    console.error('Get assigned assessments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific assessment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has access to this assessment
    if (assessment.createdBy !== req.user.id && !assessment.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If user is an assessee, check if the assessment is active
    if (req.user.role === 'assessee') {
      const now = new Date();
      const startTime = new Date(assessment.startTime);
      const endTime = new Date(assessment.endTime);
      
      if (startTime > now || endTime < now) {
        return res.status(403).json({ message: 'Assessment is not active' });
      }
    }

    // Get tests for this assessment
    const tests = [];
    for (const testId of assessment.tests) {
      const test = await Test.findById(testId);
      if (test) {
        tests.push(test);
      }
    }

    res.json({
      ...assessment,
      tests
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new assessment (assessor only)
router.post('/', authenticateToken, isAssessor, async (req, res) => {
  try {
    const {
      title,
      description,
      tests,
      assignedTo,
      startTime,
      endTime
    } = req.body;

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

    // Create the assessment
    const assessment = await Assessment.create({
      title,
      description,
      createdBy: req.user.id,
      tests,
      assignedTo: assignedTo || [],
      startTime,
      endTime
    });

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an assessment (assessor only, creator only)
router.put('/:id', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can update this assessment.' });
    }

    const {
      title,
      description,
      tests,
      assignedTo,
      startTime,
      endTime
    } = req.body;

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

    // Update the assessment
    const updatedAssessment = await Assessment.update(req.params.id, {
      title,
      description,
      tests,
      assignedTo,
      startTime,
      endTime
    });

    res.json({
      message: 'Assessment updated successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an assessment (assessor only, creator only)
router.delete('/:id', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can delete this assessment.' });
    }

    // Delete the assessment
    const deleted = await Assessment.delete(req.params.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete assessment' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a test to an assessment (assessor only, creator only)
router.post('/:id/tests/:testId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can modify this assessment.' });
    }

    // Check if test exists
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Add test to assessment
    const updatedAssessment = await Assessment.addTest(req.params.id, req.params.testId);

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
router.delete('/:id/tests/:testId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can modify this assessment.' });
    }

    // Remove test from assessment
    const updatedAssessment = await Assessment.removeTest(req.params.id, req.params.testId);

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
router.post('/:id/assign/:userId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can assign this assessment.' });
    }

    // Assign assessment to user
    const updatedAssessment = await Assessment.assignToUser(req.params.id, req.params.userId);

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
router.delete('/:id/assign/:userId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user is the creator
    if (assessment.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can unassign this assessment.' });
    }

    // Unassign assessment from user
    const updatedAssessment = await Assessment.unassignFromUser(req.params.id, req.params.userId);

    res.json({
      message: 'Assessment unassigned from user successfully',
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Unassign assessment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

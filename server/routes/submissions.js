/**
 * Submission routes for the Coding Platform
 */

const express = require('express');
const { Submission, Test, TestCase } = require('../models/db');
const { authenticateToken, isAssessor, isAssessorOrSelf } = require('../middleware/auth');
const { executeCode, runTestCases } = require('../code-execution/executor');

const router = express.Router();

// Get all submissions for a test (assessor only)
router.get('/test/:testId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator of the test
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can view all submissions.' });
    }

    const submissions = await Submission.getByTest(req.params.testId);
    res.json(submissions);
  } catch (error) {
    console.error('Get test submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all submissions by a user (self or assessor)
router.get('/user/:userId', authenticateToken, isAssessorOrSelf, async (req, res) => {
  try {
    const submissions = await Submission.getByUser(req.params.userId);
    res.json(submissions);
  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all submissions by current user
router.get('/my-submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.getByUser(req.user.id);
    res.json(submissions);
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific submission
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has access to this submission
    if (submission.userId !== req.user.id && req.user.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit code for a test
router.post('/test/:testId', authenticateToken, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ message: 'Unsupported language. Only Python and C++ are supported.' });
    }

    const test = await Test.findById(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Get all test cases for this test
    const testCases = await TestCase.getByTest(test.id);
    if (testCases.length === 0) {
      return res.status(400).json({ message: 'No test cases found for this test' });
    }

    // Run test cases
    const results = await runTestCases(code, language, testCases);
    
    // Calculate results
    const passedCount = results.filter(tc => tc.passed).length;
    const status = passedCount === testCases.length ? 'Accepted' : 'Wrong Answer';
    
    // Calculate average execution time and memory usage
    const avgExecutionTime = Math.round(
      results.reduce((sum, tc) => sum + tc.executionTime, 0) / results.length
    );
    const avgMemoryUsed = Math.round(
      results.reduce((sum, tc) => sum + tc.memoryUsed, 0) / results.length
    );

    // Create submission record
    const submission = await Submission.create({
      testId: test.id,
      userId: req.user.id,
      code,
      language,
      status,
      testCasesPassed: passedCount,
      totalTestCases: testCases.length,
      executionTime: avgExecutionTime,
      memoryUsed: avgMemoryUsed,
      testResults: results
    });

    res.status(201).json({
      message: 'Submission created successfully',
      submission
    });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// Execute code without submitting
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ message: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Execute code
    const result = await executeCode(code, language, input);
    
    res.json(result);
  } catch (error) {
    console.error('Execute code error:', error);
    res.status(500).json({ message: 'Server error during code execution' });
  }
});

// Delete a submission (self only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user is the owner of the submission
    if (submission.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the owner can delete this submission.' });
    }

    // Delete the submission
    const deleted = await Submission.delete(req.params.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete submission' });
    }

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

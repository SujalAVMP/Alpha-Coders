/**
 * Test routes for the Coding Platform
 */

const express = require('express');
const { Test, TestCase } = require('../models/db');
const { authenticateToken, isAssessor } = require('../middleware/auth');

const router = express.Router();

// Get all public tests
router.get('/public', async (req, res) => {
  try {
    const tests = await Test.getPublic();
    res.json(tests);
  } catch (error) {
    console.error('Get public tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tests (assessor only)
router.get('/', authenticateToken, isAssessor, async (req, res) => {
  try {
    const tests = await Test.getAll();
    res.json(tests);
  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tests created by current user
router.get('/my-tests', authenticateToken, async (req, res) => {
  try {
    const tests = await Test.getByCreator(req.user.id);
    res.json(tests);
  } catch (error) {
    console.error('Get my tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific test
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user has access to this test
    if (!test.isPublic && test.createdBy !== req.user.id && req.user.role !== 'assessor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get visible test cases
    const testCases = await TestCase.getVisibleByTest(test.id);

    res.json({
      ...test,
      testCases
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new test (assessor only)
router.post('/', authenticateToken, isAssessor, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      timeLimit,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      isPublic,
      testCases
    } = req.body;

    // Create the test
    const test = await Test.create({
      title,
      description,
      difficulty,
      timeLimit,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      createdBy: req.user.id,
      isPublic
    });

    // Create test cases if provided
    if (testCases && Array.isArray(testCases)) {
      for (const tc of testCases) {
        await TestCase.create({
          testId: test.id,
          input: tc.input,
          expected: tc.expected,
          isHidden: tc.isHidden || false
        });
      }
    }

    res.status(201).json({
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a test (assessor only, creator only)
router.put('/:id', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can update this test.' });
    }

    const {
      title,
      description,
      difficulty,
      timeLimit,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      isPublic
    } = req.body;

    // Update the test
    const updatedTest = await Test.update(req.params.id, {
      title,
      description,
      difficulty,
      timeLimit,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      isPublic
    });

    res.json({
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a test (assessor only, creator only)
router.delete('/:id', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can delete this test.' });
    }

    // Delete the test
    const deleted = await Test.delete(req.params.id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete test' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all test cases for a test (assessor only, creator only)
router.get('/:id/test-cases', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can view all test cases.' });
    }

    // Get all test cases
    const testCases = await TestCase.getByTest(req.params.id);

    res.json(testCases);
  } catch (error) {
    console.error('Get test cases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a test case to a test (assessor only, creator only)
router.post('/:id/test-cases', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can add test cases.' });
    }

    const { input, expected, isHidden } = req.body;

    // Create the test case
    const testCase = await TestCase.create({
      testId: req.params.id,
      input,
      expected,
      isHidden
    });

    res.status(201).json({
      message: 'Test case added successfully',
      testCase
    });
  } catch (error) {
    console.error('Add test case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a test case (assessor only, creator only)
router.put('/:id/test-cases/:caseId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can update test cases.' });
    }

    const testCase = await TestCase.findById(req.params.caseId);
    if (!testCase || testCase.testId !== req.params.id) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    const { input, expected, isHidden } = req.body;

    // Update the test case
    const updatedTestCase = await TestCase.update(req.params.caseId, {
      input,
      expected,
      isHidden
    });

    res.json({
      message: 'Test case updated successfully',
      testCase: updatedTestCase
    });
  } catch (error) {
    console.error('Update test case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a test case (assessor only, creator only)
router.delete('/:id/test-cases/:caseId', authenticateToken, isAssessor, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user is the creator
    if (test.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. Only the creator can delete test cases.' });
    }

    const testCase = await TestCase.findById(req.params.caseId);
    if (!testCase || testCase.testId !== req.params.id) {
      return res.status(404).json({ message: 'Test case not found' });
    }

    // Delete the test case
    const deleted = await TestCase.delete(req.params.caseId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete test case' });
    }

    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

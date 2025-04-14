const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/code/execute
// @desc    Execute code without submitting
// @access  Private
router.post('/execute', authenticate, codeController.executeCode);

// @route   POST /api/code/tests/:testId/run
// @desc    Run code against test cases
// @access  Private
router.post('/tests/:testId/run', authenticate, codeController.runTestCases);

// @route   GET /api/code/submissions
// @desc    Get all submissions for current user
// @access  Private
router.get('/submissions', authenticate, submissionController.getUserSubmissions);

// @route   GET /api/code/submissions/:id
// @desc    Get submission by ID
// @access  Private
router.get('/submissions/:id', authenticate, submissionController.getSubmissionById);

module.exports = router;

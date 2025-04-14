const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const submissionController = require('../controllers/submissionController');
const { authenticate, isAdmin } = require('../middleware/auth');

// @route   POST /api/tests
// @desc    Create a new test
// @access  Private (Admin)
router.post('/', authenticate, isAdmin, testController.createTest);

// @route   GET /api/tests
// @desc    Get all tests
// @access  Private
router.get('/', authenticate, testController.getAllTests);

// @route   GET /api/tests/:id
// @desc    Get test by ID
// @access  Private
router.get('/:id', authenticate, testController.getTestById);

// @route   PUT /api/tests/:id
// @desc    Update test
// @access  Private (Admin or Creator)
router.put('/:id', authenticate, testController.updateTest);

// @route   DELETE /api/tests/:id
// @desc    Delete test
// @access  Private (Admin or Creator)
router.delete('/:id', authenticate, testController.deleteTest);

// @route   POST /api/tests/:testId/submissions
// @desc    Submit code for a test
// @access  Private
router.post('/:testId/submissions', authenticate, submissionController.submitCode);

// @route   GET /api/tests/:testId/submissions
// @desc    Get all submissions for a test
// @access  Private (Admin or Creator)
router.get('/:testId/submissions', authenticate, submissionController.getTestSubmissions);

module.exports = router;

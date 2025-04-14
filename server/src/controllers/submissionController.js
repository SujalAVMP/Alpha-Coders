const Submission = require('../models/Submission');
const Test = require('../models/Test');
const axios = require('axios');

// Submit code for a test
exports.submitCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const testId = req.params.testId;
    
    // Find the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Create a new submission
    const submission = new Submission({
      user: req.user.id,
      test: testId,
      code,
      language,
      totalTestCases: test.testCases.length
    });
    
    // Save the submission
    await submission.save();
    
    // Execute the code against test cases
    // This would typically be done by a separate service
    // For now, we'll simulate it
    
    // In a real implementation, you would send the code to a code execution service
    // and update the submission with the results
    
    // For demonstration purposes, we'll just update the submission with random results
    submission.status = Math.random() > 0.5 ? 'Accepted' : 'Wrong Answer';
    submission.testCasesPassed = Math.floor(Math.random() * (test.testCases.length + 1));
    submission.executionTime = Math.floor(Math.random() * 1000);
    submission.memoryUsed = Math.floor(Math.random() * 100);
    
    await submission.save();
    
    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit code error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all submissions for a user
exports.getUserSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user.id })
      .populate('test', 'title difficulty')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error('Get user submissions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('test')
      .populate('user', 'name email');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if user is authorized to view this submission
    if (
      req.user.role !== 'admin' && 
      req.user.id.toString() !== submission.user._id.toString() &&
      req.user.id.toString() !== submission.test.createdBy.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this submission' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Get submission by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all submissions for a test
exports.getTestSubmissions = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if user is authorized to view submissions for this test
    if (req.user.role !== 'admin' && req.user.id.toString() !== test.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized to view submissions for this test' });
    }
    
    const submissions = await Submission.find({ test: req.params.testId })
      .populate('user', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    console.error('Get test submissions error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

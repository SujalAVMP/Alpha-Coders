const Test = require('../models/Test');
const Submission = require('../models/Submission');

// Create a new test
exports.createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      testCases,
      timeLimit,
      memoryLimit
    } = req.body;
    
    const test = new Test({
      title,
      description,
      difficulty,
      problemStatement,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      testCases,
      timeLimit,
      memoryLimit,
      createdBy: req.user.id
    });
    
    await test.save();
    
    res.status(201).json(test);
  } catch (error) {
    console.error('Create test error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all tests
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .select('-testCases.output -testCases.input')
      .populate('createdBy', 'name email');
    
    res.json(tests);
  } catch (error) {
    console.error('Get all tests error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get test by ID
exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Remove hidden test cases for regular users
    if (req.user.role !== 'admin' && req.user.id.toString() !== test.createdBy._id.toString()) {
      test.testCases = test.testCases.filter(tc => !tc.isHidden);
    }
    
    res.json(test);
  } catch (error) {
    console.error('Get test by ID error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update test
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if user is authorized to update
    if (req.user.role !== 'admin' && req.user.id.toString() !== test.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this test' });
    }
    
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.json(updatedTest);
  } catch (error) {
    console.error('Update test error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete test
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if user is authorized to delete
    if (req.user.role !== 'admin' && req.user.id.toString() !== test.createdBy.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this test' });
    }
    
    await Test.findByIdAndDelete(req.params.id);
    
    // Also delete all submissions for this test
    await Submission.deleteMany({ test: req.params.id });
    
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

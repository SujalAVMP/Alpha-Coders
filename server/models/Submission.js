const mongoose = require('mongoose');

const TestCaseResultSchema = new mongoose.Schema({
  input: {
    type: String
  },
  expected: {
    type: String
  },
  actual: {
    type: String
  },
  passed: {
    type: Boolean,
    default: false
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memoryUsed: {
    type: Number,
    default: 0
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const SubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: function() {
      return !this.isAssessmentSubmission; // Only required for test submissions, not assessment submissions
    }
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['python', 'cpp'],
    default: 'python'
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'error'],
    default: 'completed'
  },
  testCaseResults: [TestCaseResultSchema],
  // passedCount and totalCount fields removed in favor of testCasesPassed and totalTestCases
  score: {
    type: Number,
    default: 0
  },
  avgExecutionTime: {
    type: Number,
    default: 0
  },
  avgMemoryUsed: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isAssessmentSubmission: {
    type: Boolean,
    default: false
  },
  testSubmissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);

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
    required: true
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
  passedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);

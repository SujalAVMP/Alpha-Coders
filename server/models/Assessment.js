const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  language: {
    type: String,
    enum: ['python', 'cpp'],
    default: 'python'
  }
});

const TestAttemptSchema = new mongoose.Schema({
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
  attemptsUsed: {
    type: Number,
    default: 0
  },
  results: TestResultSchema
});

const SubmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'failed'],
    default: 'completed'
  }
});

const AssessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  }],
  invitedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitedUsers: [
    {
      type: mongoose.Schema.Types.Mixed,
      // This can be either a User ObjectId or an object with email
      // When it's a registered user, we store their ObjectId
      // When it's an unregistered email, we store {email: 'email@example.com', status: 'Invited'}
    }
  ],
  testAttempts: [TestAttemptSchema],
  submissions: [SubmissionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);

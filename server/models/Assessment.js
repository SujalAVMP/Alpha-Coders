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

// Removed TestAttemptSchema and SubmissionSchema in favor of Maps

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
  // Standardized on invitedUsers for all invitations
  invitedUsers: [
    {
      type: mongoose.Schema.Types.Mixed,
      // This can be either a User ObjectId or an object with email
      // When it's a registered user, we store their ObjectId
      // When it's an unregistered email, we store {email: 'email@example.com', status: 'Invited'}
    }
  ],
  // Track test attempts for each user using a Map
  testAttempts: {
    type: Map,
    of: {
      type: Map,
      of: {
        attemptsUsed: Number,
        lastAttemptAt: Date,
        results: TestResultSchema
      }
    },
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Track submission status for each user
  userSubmissions: {
    type: Map,
    of: {
      submitted: Boolean,
      submittedAt: Date
    },
    default: {}
  },
  // General submission status (for backward compatibility)
  submitted: {
    type: Boolean,
    default: false
  },
  submittedAt: {
    type: Date,
    default: null
  },
  // Track assessment-level submission separately from test submissions
  assessmentSubmission: {
    type: Map,
    of: {
      submittedAt: Date,
      overallScore: Number,
      totalTestsPassed: Number,
      totalTests: Number
    },
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);

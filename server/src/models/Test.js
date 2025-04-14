const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  problemStatement: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String
  },
  outputFormat: {
    type: String
  },
  constraints: {
    type: String
  },
  sampleInput: {
    type: String
  },
  sampleOutput: {
    type: String
  },
  testCases: [{
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  timeLimit: {
    type: Number,
    default: 1000 // in milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 256 // in MB
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', TestSchema);

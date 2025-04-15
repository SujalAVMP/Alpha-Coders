const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expected: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  }
});

const CodeTemplateSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  }
});

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
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
  timeLimit: {
    type: Number,
    default: 60 // in seconds
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
  testCases: [TestCaseSchema],
  codeTemplates: [CodeTemplateSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Test', TestSchema);

/**
 * Database Schema for the Coding Platform
 * 
 * This file defines the schema for the following entities:
 * - Users (with roles)
 * - Tests/Challenges
 * - Submissions
 * - Test Cases
 */

// In a real application, this would be implemented with a proper database
// For this demo, we'll use in-memory data structures

// User Schema
const userSchema = {
  id: 'string', // Unique identifier
  name: 'string', // User's full name
  email: 'string', // User's email (used for login)
  password: 'string', // Hashed password
  role: 'string', // 'assessor' or 'assessee'
  createdAt: 'date',
  updatedAt: 'date'
};

// Test/Challenge Schema
const testSchema = {
  id: 'string', // Unique identifier
  title: 'string', // Test title
  description: 'string', // Test description
  difficulty: 'string', // 'Easy', 'Medium', 'Hard'
  timeLimit: 'number', // Time limit in minutes
  problemStatement: 'string', // Detailed problem statement
  inputFormat: 'string', // Description of input format
  outputFormat: 'string', // Description of output format
  constraints: 'string', // Constraints on input/output
  sampleInput: 'string', // Sample input
  sampleOutput: 'string', // Sample output
  createdBy: 'string', // User ID of the assessor who created the test
  isPublic: 'boolean', // Whether the test is public or private
  createdAt: 'date',
  updatedAt: 'date'
};

// Test Case Schema
const testCaseSchema = {
  id: 'string', // Unique identifier
  testId: 'string', // ID of the test this case belongs to
  input: 'string', // Input for the test case
  expected: 'string', // Expected output
  isHidden: 'boolean', // Whether this is a hidden test case
  createdAt: 'date',
  updatedAt: 'date'
};

// Submission Schema
const submissionSchema = {
  id: 'string', // Unique identifier
  testId: 'string', // ID of the test
  userId: 'string', // ID of the user who submitted
  code: 'string', // Submitted code
  language: 'string', // Programming language
  status: 'string', // 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
  testCasesPassed: 'number', // Number of test cases passed
  totalTestCases: 'number', // Total number of test cases
  executionTime: 'number', // Execution time in milliseconds
  memoryUsed: 'number', // Memory used in MB
  testResults: 'array', // Array of test case results
  submittedAt: 'date'
};

// Assessment Schema (for assessors to create assessments for multiple assessees)
const assessmentSchema = {
  id: 'string', // Unique identifier
  title: 'string', // Assessment title
  description: 'string', // Assessment description
  createdBy: 'string', // User ID of the assessor who created the assessment
  tests: 'array', // Array of test IDs included in this assessment
  assignedTo: 'array', // Array of user IDs this assessment is assigned to
  startTime: 'date', // When the assessment starts
  endTime: 'date', // When the assessment ends
  createdAt: 'date',
  updatedAt: 'date'
};

module.exports = {
  userSchema,
  testSchema,
  testCaseSchema,
  submissionSchema,
  assessmentSchema
};

/**
 * In-memory database for the Coding Platform
 *
 * This file implements an in-memory database for the application.
 * In a real application, this would be replaced with a proper database like MongoDB or PostgreSQL.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory database
const db = {
  users: [],
  tests: [],
  testCases: [],
  submissions: [],
  assessments: []
};

// User methods
const User = {
  // Create a new user
  async create(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'assessee', // Default role is assessee
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.users.push(user);
    return { ...user, password: undefined }; // Don't return the password
  },

  // Find a user by ID
  findById(id) {
    const user = db.users.find(user => user.id === id);
    if (user) {
      return { ...user, password: undefined }; // Don't return the password
    }
    return null;
  },

  // Find a user by email
  findByEmail(email) {
    return db.users.find(user => user.email === email);
  },

  // Update a user
  update(id, userData) {
    const index = db.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    const updatedUser = {
      ...db.users[index],
      ...userData,
      updatedAt: new Date()
    };
    db.users[index] = updatedUser;
    return { ...updatedUser, password: undefined }; // Don't return the password
  },

  // Delete a user
  delete(id) {
    const index = db.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    db.users.splice(index, 1);
    return true;
  },

  // Get all users
  getAll() {
    return db.users.map(user => ({ ...user, password: undefined })); // Don't return passwords
  },

  // Get users by role
  getByRole(role) {
    return db.users
      .filter(user => user.role === role)
      .map(user => ({ ...user, password: undefined })); // Don't return passwords
  }
};

// Test methods
const Test = {
  // Create a new test
  create(testData) {
    const test = {
      id: uuidv4(),
      title: testData.title,
      description: testData.description || '',
      difficulty: testData.difficulty || 'Medium',
      timeLimit: testData.timeLimit || 60, // Default 60 minutes
      problemStatement: testData.problemStatement || '',
      inputFormat: testData.inputFormat || '',
      outputFormat: testData.outputFormat || '',
      constraints: testData.constraints || '',
      sampleInput: testData.sampleInput || '',
      sampleOutput: testData.sampleOutput || '',
      createdBy: testData.createdBy,
      isPublic: testData.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.tests.push(test);
    return test;
  },

  // Find a test by ID
  findById(id) {
    return db.tests.find(test => test.id === id);
  },

  // Update a test
  update(id, testData) {
    const index = db.tests.findIndex(test => test.id === id);
    if (index === -1) return null;

    const updatedTest = {
      ...db.tests[index],
      ...testData,
      updatedAt: new Date()
    };
    db.tests[index] = updatedTest;
    return updatedTest;
  },

  // Delete a test
  delete(id) {
    const index = db.tests.findIndex(test => test.id === id);
    if (index === -1) return false;
    db.tests.splice(index, 1);

    // Also delete associated test cases
    db.testCases = db.testCases.filter(tc => tc.testId !== id);

    return true;
  },

  // Get all tests
  getAll() {
    return db.tests;
  },

  // Get public tests
  getPublic() {
    return db.tests.filter(test => test.isPublic);
  },

  // Get tests created by a specific user
  getByCreator(userId) {
    return db.tests.filter(test => test.createdBy === userId);
  }
};

// Test Case methods
const TestCase = {
  // Create a new test case
  create(testCaseData) {
    const testCase = {
      id: uuidv4(),
      testId: testCaseData.testId,
      input: testCaseData.input,
      expected: testCaseData.expected,
      isHidden: testCaseData.isHidden || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.testCases.push(testCase);
    return testCase;
  },

  // Find a test case by ID
  findById(id) {
    return db.testCases.find(tc => tc.id === id);
  },

  // Update a test case
  update(id, testCaseData) {
    const index = db.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return null;

    const updatedTestCase = {
      ...db.testCases[index],
      ...testCaseData,
      updatedAt: new Date()
    };
    db.testCases[index] = updatedTestCase;
    return updatedTestCase;
  },

  // Delete a test case
  delete(id) {
    const index = db.testCases.findIndex(tc => tc.id === id);
    if (index === -1) return false;
    db.testCases.splice(index, 1);
    return true;
  },

  // Get all test cases for a specific test
  getByTest(testId) {
    return db.testCases.filter(tc => tc.testId === testId);
  },

  // Get visible test cases for a specific test
  getVisibleByTest(testId) {
    return db.testCases.filter(tc => tc.testId === testId && !tc.isHidden);
  },

  // Get hidden test cases for a specific test
  getHiddenByTest(testId) {
    return db.testCases.filter(tc => tc.testId === testId && tc.isHidden);
  }
};

// Submission methods
const Submission = {
  // Create a new submission
  create(submissionData) {
    const submission = {
      id: uuidv4(),
      testId: submissionData.testId,
      userId: submissionData.userId,
      code: submissionData.code,
      language: submissionData.language,
      status: submissionData.status,
      testCasesPassed: submissionData.testCasesPassed,
      totalTestCases: submissionData.totalTestCases,
      executionTime: submissionData.executionTime,
      memoryUsed: submissionData.memoryUsed,
      testResults: submissionData.testResults || [],
      submittedAt: new Date()
    };
    db.submissions.push(submission);
    return submission;
  },

  // Find a submission by ID
  findById(id) {
    return db.submissions.find(sub => sub.id === id);
  },

  // Get all submissions for a specific test
  getByTest(testId) {
    return db.submissions.filter(sub => sub.testId === testId);
  },

  // Get all submissions by a specific user
  getByUser(userId) {
    return db.submissions.filter(sub => sub.userId === userId);
  },

  // Get all submissions for a specific test by a specific user
  getByTestAndUser(testId, userId) {
    return db.submissions.filter(sub => sub.testId === testId && sub.userId === userId);
  },

  // Delete a submission
  delete(id) {
    const index = db.submissions.findIndex(sub => sub.id === id);
    if (index === -1) return false;
    db.submissions.splice(index, 1);
    return true;
  }
};

// Assessment methods
const Assessment = {
  // Create a new assessment
  create(assessmentData) {
    const assessment = {
      id: uuidv4(),
      title: assessmentData.title,
      description: assessmentData.description || '',
      createdBy: assessmentData.createdBy,
      tests: assessmentData.tests || [],
      assignedTo: assessmentData.assignedTo || [],
      startTime: assessmentData.startTime,
      endTime: assessmentData.endTime,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    db.assessments.push(assessment);
    return assessment;
  },

  // Find an assessment by ID
  findById(id) {
    return db.assessments.find(a => a.id === id);
  },

  // Update an assessment
  update(id, assessmentData) {
    const index = db.assessments.findIndex(a => a.id === id);
    if (index === -1) return null;

    const updatedAssessment = {
      ...db.assessments[index],
      ...assessmentData,
      updatedAt: new Date()
    };
    db.assessments[index] = updatedAssessment;
    return updatedAssessment;
  },

  // Delete an assessment
  delete(id) {
    const index = db.assessments.findIndex(a => a.id === id);
    if (index === -1) return false;
    db.assessments.splice(index, 1);
    return true;
  },

  // Get all assessments created by a specific user
  getByCreator(userId) {
    return db.assessments.filter(a => a.createdBy === userId);
  },

  // Get all assessments assigned to a specific user
  getByAssignee(userId) {
    return db.assessments.filter(a => a.assignedTo.includes(userId));
  },

  // Add a test to an assessment
  addTest(id, testId) {
    const assessment = this.findById(id);
    if (!assessment) return null;

    if (!assessment.tests.includes(testId)) {
      assessment.tests.push(testId);
      assessment.updatedAt = new Date();
    }
    return assessment;
  },

  // Remove a test from an assessment
  removeTest(id, testId) {
    const assessment = this.findById(id);
    if (!assessment) return null;

    const index = assessment.tests.indexOf(testId);
    if (index !== -1) {
      assessment.tests.splice(index, 1);
      assessment.updatedAt = new Date();
    }
    return assessment;
  },

  // Assign an assessment to a user
  assignToUser(id, userId) {
    const assessment = this.findById(id);
    if (!assessment) return null;

    if (!assessment.assignedTo.includes(userId)) {
      assessment.assignedTo.push(userId);
      assessment.updatedAt = new Date();
    }
    return assessment;
  },

  // Unassign an assessment from a user
  unassignFromUser(id, userId) {
    const assessment = this.findById(id);
    if (!assessment) return null;

    const index = assessment.assignedTo.indexOf(userId);
    if (index !== -1) {
      assessment.assignedTo.splice(index, 1);
      assessment.updatedAt = new Date();
    }
    return assessment;
  }
};

// Initialize with some sample data
function initializeData() {
  // Create sample users
  const adminUser = User.create({
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'admin123',
    role: 'assessor'
  });

  const testUser = User.create({
    name: 'Test User',
    email: 'test@gmail.com',
    password: 'test123',
    role: 'assessee'
  });

  // Create sample tests
  const twoSumTest = Test.create({
    title: 'Two Sum',
    description: 'Find two numbers in an array that add up to a target',
    difficulty: 'Easy',
    timeLimit: 30,
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    inputFormat: 'First line contains an array of integers separated by space. Second line contains the target sum.',
    outputFormat: 'Return the indices of the two numbers that add up to the target.',
    constraints: 'You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    sampleInput: '[2, 7, 11, 15]\n9',
    sampleOutput: '[0, 1]',
    createdBy: adminUser.id,
    isPublic: true
  });

  const reverseLinkedListTest = Test.create({
    title: 'Reverse Linked List',
    description: 'Reverse a singly linked list',
    difficulty: 'Medium',
    timeLimit: 45,
    problemStatement: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    inputFormat: 'The input is an array representing the linked list.',
    outputFormat: 'Return the reversed linked list as an array.',
    constraints: 'The number of nodes in the list is in the range [0, 5000].',
    sampleInput: '[1, 2, 3, 4, 5]',
    sampleOutput: '[5, 4, 3, 2, 1]',
    createdBy: adminUser.id,
    isPublic: true
  });

  // Create sample test cases
  TestCase.create({
    testId: twoSumTest.id,
    input: '[2, 7, 11, 15]\n9',
    expected: '[0, 1]',
    isHidden: false
  });

  TestCase.create({
    testId: twoSumTest.id,
    input: '[3, 2, 4]\n6',
    expected: '[1, 2]',
    isHidden: false
  });

  TestCase.create({
    testId: twoSumTest.id,
    input: '[3, 3]\n6',
    expected: '[0, 1]',
    isHidden: true
  });

  TestCase.create({
    testId: reverseLinkedListTest.id,
    input: '[1, 2, 3, 4, 5]',
    expected: '[5, 4, 3, 2, 1]',
    isHidden: false
  });

  TestCase.create({
    testId: reverseLinkedListTest.id,
    input: '[1, 2]',
    expected: '[2, 1]',
    isHidden: false
  });

  // Create a sample assessment
  Assessment.create({
    title: 'Basic Algorithms Assessment',
    description: 'Assessment covering basic algorithms and data structures',
    createdBy: adminUser.id,
    tests: [twoSumTest.id, reverseLinkedListTest.id],
    assignedTo: [testUser.id],
    startTime: new Date(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  });
}

module.exports = {
  User,
  Test,
  TestCase,
  Submission,
  Assessment,
  initializeData
};

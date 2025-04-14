const express = require('express');
const cors = require('cors');
const { executeCode, runTestCases, buildDockerImage } = require('./code-execution/executor');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// Store registered users in memory
const users = [
  // No default users - users will be added when they register
];

// Auth routes
app.post('/api/auth/register', (req, res) => {
  console.log('Register request body:', req.body);

  const { name, email, password, role } = req.body;

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  // Create new user
  const newUser = {
    id: Math.random().toString(36).substring(7),
    name: name || 'New User',
    email: email,
    password: password,
    role: role || 'assessee' // Default role is assessee
  };

  // Add to users array
  users.push(newUser);

  // Simulate successful registration
  res.status(201).json({
    token: 'test-token',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request body:', req.body);

  const { email, password } = req.body;

  // Find user by email
  const user = users.find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Simulate successful login
  res.json({
    token: 'test-token',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  // Get the token from the request
  const authHeader = req.headers.authorization;
  console.log('Auth header for /me:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token for /me:', token);

  // For this test server, we'll use the token to determine the user
  // In a real app, we would verify the JWT token
  if (token === 'test-token') {
    // Get the email from the query parameter if provided
    let email = req.query.email;
    console.log('Email from query:', email);

    // Handle case where email is an array
    if (Array.isArray(email)) {
      email = email[0];
      console.log('Email is an array, using first value:', email);
    }

    // For testing purposes, if no valid user is found, create one
    if (email && !users.some(u => u.email === email)) {
      console.log('Creating new user for email:', email);
      // Use a fixed ID for testing purposes
      const newUser = {
        id: 'test-user-id',
        name: email.split('@')[0],
        email: email,
        password: 'password123',
        role: 'assessor'
      };
      users.push(newUser);
      console.log('New user created:', newUser);
    }

    let user;

    if (email) {
      // Find the user by email
      user = users.find(u => u.email === email);
      console.log('Found user by email:', user);
    } else {
      // If no email provided, use the most recently registered user
      user = users.length > 0 ? users[users.length - 1] : null;
      console.log('Using most recent user:', user);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Returning user for /me:', user);
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  }

  return res.status(401).json({ message: 'Invalid token' });
});

// Sample test templates for assessors to use
const sampleTestTemplates = [
  {
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target',
    difficulty: 'Easy',
    timeLimit: 60,
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    inputFormat: 'First line contains an array of integers separated by space. Second line contains the target integer.',
    outputFormat: 'Return the indices of the two numbers that add up to the target.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    sampleInput: '[2,7,11,15]\n9',
    sampleOutput: '[0,1]',
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0,1]', isHidden: false },
      { input: '[3,2,4]\n6', expected: '[1,2]', isHidden: false },
      { input: '[3,3]\n6', expected: '[0,1]', isHidden: true }
    ]
  },
  {
    title: 'Reverse Linked List',
    description: 'Reverse a singly linked list',
    difficulty: 'Medium',
    timeLimit: 60,
    problemStatement: 'Given the head of a singly linked list, reverse the list, and return the reversed list. The linked list is represented as an array for simplicity.',
    inputFormat: 'The input is an array representing the linked list.',
    outputFormat: 'Return the reversed linked list as an array.',
    constraints: 'The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000',
    sampleInput: '[1,2,3,4,5]',
    sampleOutput: '[5,4,3,2,1]',
    testCases: [
      { input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]', expected: '[2,1]', isHidden: false },
      { input: '[]', expected: '[]', isHidden: true }
    ]
  },
  {
    title: 'Merge K Sorted Lists',
    description: 'Merge k sorted linked lists into one sorted linked list',
    difficulty: 'Hard',
    timeLimit: 90,
    problemStatement: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it. The linked lists are represented as arrays for simplicity.',
    inputFormat: 'The input is an array of arrays, where each inner array represents a linked list.',
    outputFormat: 'Return the merged linked list as an array.',
    constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nlists[i] is sorted in ascending order.\nThe sum of lists[i].length will not exceed 10^4.',
    sampleInput: '[[1,4,5],[1,3,4],[2,6]]',
    sampleOutput: '[1,1,2,3,4,4,5,6]',
    testCases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expected: '[1,1,2,3,4,4,5,6]', isHidden: false },
      { input: '[]', expected: '[]', isHidden: false },
      { input: '[[]]', expected: '[]', isHidden: true }
    ]
  },
  {
    title: 'Valid Parentheses',
    description: 'Determine if a string of parentheses is valid',
    difficulty: 'Easy',
    timeLimit: 45,
    problemStatement: 'Given a string s containing just the characters \'(\', \')\'\', \'{\', \'}\'\', \'[\' and \']\', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
    inputFormat: 'A string containing only parentheses characters: (){}[]',
    outputFormat: 'Return true if the string is valid, false otherwise.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'.',
    sampleInput: '()[]{}',
    sampleOutput: 'true',
    testCases: [
      { input: '()[]{}', expected: 'true', isHidden: false },
      { input: '([)]', expected: 'false', isHidden: false },
      { input: '{[]}', expected: 'true', isHidden: false },
      { input: '((', expected: 'false', isHidden: true }
    ]
  },
  {
    title: 'Maximum Subarray',
    description: 'Find the contiguous subarray with the largest sum',
    difficulty: 'Medium',
    timeLimit: 60,
    problemStatement: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    inputFormat: 'An array of integers.',
    outputFormat: 'The maximum sum of a contiguous subarray.',
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '[-2,1,-3,4,-1,2,1,-5,4]',
    sampleOutput: '6',
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', isHidden: false },
      { input: '[1]', expected: '1', isHidden: false },
      { input: '[5,4,-1,7,8]', expected: '23', isHidden: false },
      { input: '[-1]', expected: '-1', isHidden: true }
    ]
  }
];

// Mock tests data - empty by default for new users
const tests = [];

// Mock assessments data - empty by default for new users
const assessments = [];

// Mock registered users for invitation system
const registeredUsers = [
  // No default users - users will be added when they register
];

// Mock notifications data
const notifications = [
  // Empty by default - notifications will be added when students are invited
];

// Tests routes
app.get('/api/tests', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('GET /api/tests - Auth Header:', authHeader, 'Email:', userEmail);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, try to find by token (fallback)
  if (!user) {
    // For testing purposes, we'll return all tests for any authenticated user
    console.log('User not found by email, returning all tests');
    return res.json(tests);
  }

  console.log('User found:', user);

  // If the user is an assessor, return all tests
  if (user.role === 'assessor') {
    console.log('Returning all tests for assessor');
    return res.json(tests);
  }

  // If the user is an assessee, return only tests that are part of their assigned assessments
  const assignedAssessments = assessments.filter(assessment => {
    // Check if the user's email is in the invitedStudents array as an object
    const invitedByEmail = assessment.invitedStudents.some(student =>
      typeof student === 'object' && student.email === user.email
    );

    // Check if the user's ID is in the invitedStudents array
    const invitedById = assessment.invitedStudents.includes(user.id);

    return invitedByEmail || invitedById;
  });

  console.log('Assigned assessments:', assignedAssessments.length);

  // Extract all test IDs from assigned assessments
  const assignedTestIds = new Set();
  assignedAssessments.forEach(assessment => {
    if (assessment.tests && Array.isArray(assessment.tests)) {
      assessment.tests.forEach(testId => assignedTestIds.add(testId));
    }
  });

  console.log('Assigned test IDs:', [...assignedTestIds]);

  // Filter tests to only include those in assigned assessments
  const accessibleTests = tests.filter(test => assignedTestIds.has(test._id));

  console.log('Returning accessible tests for assessee:', accessibleTests.length);
  res.json(accessibleTests);
});

// Get public tests
app.get('/api/tests/public', (req, res) => {
  // Return only public tests
  const publicTests = tests.filter(test => test.isPublic);
  res.json(publicTests);
});

// Get tests created by the current user
app.get('/api/tests/my-tests', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Return tests created by the current user
  const myTests = tests.filter(test => test.createdBy === userId);
  res.json(myTests);
});

// Create a new test or assessment
app.post('/api/tests', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get the test data from the request body
  const testData = req.body;

  // Create a new test with the provided data
  const newTest = {
    ...testData,
    _id: Date.now().toString(),
    createdBy: userId,
    createdAt: new Date().toISOString()
  };

  // Add the test to the tests array
  tests.push(newTest);

  // If this is an assessment with questions, create an assessment entry
  if (testData.questions && Array.isArray(testData.questions) && testData.questions.length > 0) {
    const newAssessment = {
      id: newTest._id,
      title: testData.title,
      description: testData.description || '',
      startTime: testData.startTime || new Date().toISOString(),
      endTime: testData.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxAttempts: testData.maxAttempts || 1,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      tests: testData.questions.map(q => q._id || Date.now().toString() + Math.random().toString(36).substring(2, 15)),
      invitedStudents: []
    };

    // Add the assessment to the assessments array
    assessments.push(newAssessment);
  }

  // Return the new test
  res.status(201).json(newTest);
});

// Get sample test templates
app.get('/api/tests/templates', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Return sample test templates
  res.json(sampleTestTemplates);
});

// Create a test from a template
app.post('/api/tests/from-template/:templateIndex', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const templateIndex = parseInt(req.params.templateIndex);

  if (isNaN(templateIndex) || templateIndex < 0 || templateIndex >= sampleTestTemplates.length) {
    return res.status(400).json({ message: 'Invalid template index' });
  }

  // Create a new test from the template
  const template = sampleTestTemplates[templateIndex];
  const newTest = {
    ...template,
    _id: Date.now().toString(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    isPublic: false // Default to private
  };

  // Add the test to the tests array
  tests.push(newTest);

  // Return the new test
  res.status(201).json(newTest);
});

app.get('/api/tests/:id', (req, res) => {
  // Get the test ID from the request
  const testId = req.params.id;

  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? req.headers.authorization.split(' ')[1] === 'test-token' ? 'test123' : 'admin123' : null;

  // Find the test by ID
  const test = tests.find(t => t._id === testId);

  if (!test) {
    return res.status(404).json({ message: 'Test not found' });
  }

  // Check if the user has permission to view this test
  const isCreator = test.createdBy === userId;
  const isPublic = test.isPublic;
  const isInvited = assessments.some(a =>
    a.tests.includes(testId) &&
    (a.isPublic || a.invitedStudents.includes(userId))
  );

  if (!isCreator && !isPublic && !isInvited) {
    return res.status(403).json({ message: 'You do not have permission to view this test' });
  }

  // Add detailed test information
  const detailedTest = {
    ...test,
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    inputFormat: 'First line contains an array of integers separated by space. Second line contains the target integer.',
    outputFormat: 'Return the indices of the two numbers that add up to the target.',
    constraints: 'You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    sampleInput: '[2, 7, 11, 15]\n9',
    sampleOutput: '[0, 1]',
    createdBy: {
      name: userId === 'admin123' ? 'Admin' : 'Test User',
      email: userId === 'admin123' ? 'admin@gmail.com' : 'test@gmail.com'
    }
  };

  // Return the test
  res.json(detailedTest);
});

// Assessments routes
// Create a new assessment
app.post('/api/assessments', (req, res) => {
  console.log('Create assessment request body:', req.body);

  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('POST /api/assessments - Auth Header:', authHeader, 'Email:', userEmail);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, return error
  if (!user) {
    console.log('User not found by email, returning error');
    return res.status(404).json({ message: 'User not found' });
  }

  console.log('User found for assessment creation:', user);

  try {
    // Make sure tests is an array
    const testsArray = Array.isArray(req.body.tests) ? req.body.tests : [];
    console.log('Tests array for assessment:', testsArray);

    // Create a new assessment
    const newAssessment = {
      id: `assessment_${assessments.length + 1}`,
      ...req.body,
      tests: testsArray, // Ensure tests is an array
      createdBy: user.id,
      invitedStudents: [], // Start with empty array, not default values
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Ensure invitedStudents is an array and doesn't contain example.com emails
    if (!Array.isArray(newAssessment.invitedStudents)) {
      newAssessment.invitedStudents = [];
    }

    // Filter out any example.com emails
    newAssessment.invitedStudents = newAssessment.invitedStudents.filter(student => {
      if (typeof student === 'object' && student.email) {
        return !student.email.includes('example.com');
      }
      return true;
    });

    console.log('Filtered invitedStudents for new assessment:', newAssessment.invitedStudents);

    console.log('New assessment being created:', newAssessment);

    // Add the assessment to the assessments array
    assessments.push(newAssessment);

    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an existing assessment
app.put('/api/assessments/:id', (req, res) => {
  console.log(`Update assessment ${req.params.id} request body:`, req.body);

  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('PUT /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', req.params.id);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, return error
  if (!user) {
    console.log('User not found by email, returning error');
    return res.status(404).json({ message: 'User not found' });
  }

  console.log('User found for assessment update:', user);

  try {
    // Find the assessment
    const assessmentIndex = assessments.findIndex(a => a.id === req.params.id);

    if (assessmentIndex === -1) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Make sure tests is an array
    const testsArray = Array.isArray(req.body.tests) ? req.body.tests : [];
    console.log('Tests array for assessment update:', testsArray);

    // Preserve the existing invitedStudents if not provided in the request
    const existingInvitedStudents = assessments[assessmentIndex].invitedStudents || [];
    let invitedStudents = req.body.invitedStudents || existingInvitedStudents;

    // Filter out any example.com emails from invitedStudents
    if (Array.isArray(invitedStudents)) {
      invitedStudents = invitedStudents.filter(student => {
        if (typeof student === 'object' && student.email) {
          return !student.email.includes('example.com');
        }
        return true;
      });
    }

    console.log('Filtered invitedStudents:', invitedStudents);

    // Update the assessment
    const updatedAssessment = {
      ...assessments[assessmentIndex],
      ...req.body,
      tests: testsArray, // Ensure tests is an array
      invitedStudents: invitedStudents, // Preserve invited students (without example.com)
      updatedAt: new Date().toISOString()
    };

    console.log('Updated assessment:', updatedAssessment);

    // Replace the assessment in the assessments array
    assessments[assessmentIndex] = updatedAssessment;

    res.json(updatedAssessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/assessments/my-assessments', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('GET /api/assessments/my-assessments - Auth Header:', authHeader, 'Email:', userEmail);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, return empty array
  if (!user) {
    console.log('User not found by email, returning empty array');
    return res.json([]);
  }

  console.log('User found for my assessments:', user);

  // Return assessments created by the current user
  const myAssessments = assessments.filter(assessment => {
    console.log('Checking assessment:', assessment.id, 'createdBy:', assessment.createdBy, 'user.id:', user.id);
    return assessment.createdBy === user.id;
  });

  console.log('Found assessments count:', myAssessments.length);

  // Add information about invited users to each assessment
  const assessmentsWithInvitedUsers = myAssessments.map(assessment => {
    // Filter out example.com emails from invitedStudents
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      assessment.invitedStudents = assessment.invitedStudents.filter(student => {
        if (typeof student === 'object' && student.email) {
          return !student.email.includes('example.com');
        }
        return true;
      });
    }

    // Get information about invited users
    const invitedUsers = [];

    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      assessment.invitedStudents.forEach(student => {
        if (typeof student === 'string') {
          // It's a user ID
          const foundUser = users.find(u => u.id === student);
          if (foundUser) {
            invitedUsers.push({
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email
            });
          } else {
            invitedUsers.push({ id: student, name: 'Unknown User', email: 'unknown' });
          }
        } else if (typeof student === 'object' && student.email) {
          // It's an email object
          invitedUsers.push({
            id: 'email_' + student.email,
            name: student.email.split('@')[0],
            email: student.email
          });
        }
      });
    }

    console.log('Assessment', assessment.id, 'invited users:', invitedUsers);

    return {
      ...assessment,
      invitedUsers
    };
  });

  res.json(assessmentsWithInvitedUsers);
});

app.get('/api/assessments/assigned', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('GET /api/assessments/assigned - Auth Header:', authHeader, 'Email:', userEmail);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, return empty array for testing purposes
  if (!user) {
    console.log('User not found by email, returning empty array');
    return res.json([]);
  }

  console.log('User found:', user);

  // Filter out example.com emails from all assessments
  assessments.forEach(assessment => {
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      assessment.invitedStudents = assessment.invitedStudents.filter(student => {
        if (typeof student === 'object' && student.email) {
          return !student.email.includes('example.com');
        }
        return true;
      });
    }
  });

  // Return ONLY assessments where the user has been specifically invited
  // New users should not see any assessments by default
  const assignedAssessments = assessments.filter(assessment => {
    // Check if invitedStudents exists and includes the user ID
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      // Check for user ID in the array
      if (assessment.invitedStudents.includes(user.id)) {
        return true;
      }

      // Check for email objects in the array
      for (const student of assessment.invitedStudents) {
        if (typeof student === 'object' && student.email &&
            student.email.toLowerCase() === user.email.toLowerCase()) {
          return true;
        }
      }
    }

    // Check if invitedUsers exists and includes the user ID or email
    if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
      return assessment.invitedUsers.some(invitedUser =>
        invitedUser.id === user.id ||
        invitedUser === user.id ||
        (typeof invitedUser === 'object' &&
         invitedUser.email &&
         invitedUser.email.toLowerCase() === user.email.toLowerCase()));
    }

    return false;
  });

  console.log('Assigned assessments count:', assignedAssessments.length);

  // Add a flag to indicate if this is a new invitation and include invited users info
  const assessmentsWithFlags = assignedAssessments.map(assessment => {
    // Check if there's a notification for this assessment
    const hasUnreadNotification = notifications.some(n =>
      n.userId === userId &&
      n.assessmentId === assessment.id &&
      n.type === 'invitation' &&
      !n.read
    );

    // Get information about invited users
    let invitedUsers = [];

    // Handle invitedStudents array if it exists
    if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
      invitedUsers = assessment.invitedStudents.map(studentId => {
        const user = registeredUsers.find(u => u.id === studentId);
        return user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : { id: studentId, name: 'Unknown User', email: 'unknown' };
      });
    }

    // Handle invitedUsers array if it exists
    if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
      // If we already have invitedUsers from invitedStudents, merge them
      const existingIds = invitedUsers.map(u => u.id);

      assessment.invitedUsers.forEach(user => {
        // If it's just an ID string
        if (typeof user === 'string') {
          if (!existingIds.includes(user)) {
            const userObj = registeredUsers.find(u => u.id === user);
            if (userObj) {
              invitedUsers.push({
                id: userObj.id,
                name: userObj.name,
                email: userObj.email
              });
              existingIds.push(user);
            } else {
              invitedUsers.push({ id: user, name: 'Unknown User', email: 'unknown' });
              existingIds.push(user);
            }
          }
        }
        // If it's already a user object
        else if (user && user.id && !existingIds.includes(user.id)) {
          invitedUsers.push(user);
          existingIds.push(user.id);
        }
      });
    }

    return {
      ...assessment,
      isNewInvitation: hasUnreadNotification,
      invitedUsers // Include the full user information
    };
  });

  res.json(assessmentsWithFlags);
});

// Delete an assessment
app.delete('/api/assessments/:id', (req, res) => {
  console.log(`Delete assessment ${req.params.id} request`);

  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Find the assessment
    const assessmentIndex = assessments.findIndex(a => a.id === req.params.id);

    if (assessmentIndex === -1) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Remove the assessment from the assessments array
    assessments.splice(assessmentIndex, 1);

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/assessments/:id', (req, res) => {
  // Get the assessment ID from the request
  const assessmentId = req.params.id;

  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('GET /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the assessment by ID
  const assessment = assessments.find(a => a.id === assessmentId);

  console.log('Looking for assessment with ID:', assessmentId);
  console.log('Available assessments:', assessments.map(a => a.id));

  if (!assessment) {
    console.log('Assessment not found');
    return res.status(404).json({ message: 'Assessment not found' });
  }

  console.log('Assessment found:', assessment);

  // Filter out example.com emails from invitedStudents
  if (assessment.invitedStudents && Array.isArray(assessment.invitedStudents)) {
    assessment.invitedStudents = assessment.invitedStudents.filter(student => {
      if (typeof student === 'object' && student.email) {
        return !student.email.includes('example.com');
      }
      return true;
    });
  }

  // Find the user by email first (more reliable)
  let user = null;
  if (userEmail) {
    user = users.find(u => u.email === userEmail);
  }

  // If user not found by email, assume they're an assessor for testing purposes
  if (!user) {
    console.log('User not found by email, assuming assessor role');
    // For testing purposes, we'll allow access to the assessment
    // Get the full test details for each test in the assessment
    const testDetails = [];
    if (assessment.tests && Array.isArray(assessment.tests)) {
      assessment.tests.forEach(testId => {
        const test = tests.find(t => t._id === testId);
        if (test) {
          testDetails.push(test);
        }
      });
    }

    console.log('Test details count (assessor fallback):', testDetails.length);

    return res.json({
      ...assessment,
      testDetails
    });
  }

  console.log('User found:', user);

  // Check if the user has permission to view this assessment
  const isCreator = assessment.createdBy === user.id;
  const isPublic = assessment.isPublic;

  console.log('Creator check:', { assessmentCreatedBy: assessment.createdBy, userId: user.id, isCreator });

  // Check if the user is invited by email or ID
  const isInvitedById = assessment.invitedStudents.includes(user.id);
  const isInvitedByEmail = assessment.invitedStudents.some(student =>
    typeof student === 'object' && student.email === user.email
  );
  const isInvited = isInvitedById || isInvitedByEmail;

  console.log('Permission check:', { isCreator, isPublic, isInvited, isInvitedById, isInvitedByEmail });

  if (!isCreator && !isPublic && !isInvited) {
    return res.status(403).json({ message: 'You do not have permission to view this assessment' });
  }

  // Get the full test details for each test in the assessment
  const testDetails = [];
  if (assessment.tests && Array.isArray(assessment.tests)) {
    assessment.tests.forEach(testId => {
      const test = tests.find(t => t._id === testId);
      if (test) {
        // For assessees, hide the test cases that are marked as hidden
        if (user.role === 'assessee') {
          const filteredTest = {
            ...test,
            testCases: test.testCases.filter(tc => !tc.isHidden)
          };
          testDetails.push(filteredTest);
        } else {
          testDetails.push(test);
        }
      }
    });
  }

  console.log('Test details count:', testDetails.length);

  // Return the assessment with full test details
  res.json({
    ...assessment,
    testDetails
  });
});

// Get all registered assessees (for invitation dropdown)
app.get('/api/users/assessees', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Return only assessees (not assessors)
  const assessees = registeredUsers.filter(user => user.role === 'assessee');

  // Return only the necessary information
  const assesseesList = assessees.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name
  }));

  res.json(assesseesList);
});

app.post('/api/assessments/:id/invite', (req, res) => {
  // Get the assessment ID from the request
  const assessmentId = req.params.id;

  // Get the user from the request (in a real app, this would be from the token)
  const authHeader = req.headers.authorization;
  let userEmail = req.query.email;

  // Handle case where email is an array
  if (Array.isArray(userEmail)) {
    userEmail = userEmail[0];
    console.log('Email is an array, using first value:', userEmail);
  }

  console.log('POST /api/assessments/:id/invite - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Find the assessment by ID
  const assessment = assessments.find(a => a.id === assessmentId);

  if (!assessment) {
    return res.status(404).json({ message: 'Assessment not found' });
  }

  // Check if the user is the creator of the assessment
  // For testing purposes, we'll allow any authenticated user to invite students
  console.log('Assessment creator check:', { assessmentCreator: assessment.createdBy, currentUser: userEmail });

  // Uncomment this to enforce creator check
  // if (assessment.createdBy !== userId) {
  //   return res.status(403).json({ message: 'You do not have permission to invite students to this assessment' });
  // }

  // Get the user IDs or emails from the request body
  const { userIds, emails } = req.body;

  console.log('Invitation request:', { userIds, emails });

  // Make sure invitedStudents exists and is an array
  if (!assessment.invitedStudents) {
    assessment.invitedStudents = [];
  } else if (!Array.isArray(assessment.invitedStudents)) {
    assessment.invitedStudents = [assessment.invitedStudents];
  }


  // Initialize arrays for tracking invitations
  let invitedUserIds = [];
  let notFoundEmails = [];

  // Process user IDs if provided
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    invitedUserIds = userIds;
    console.log('Processing user IDs:', userIds);
  }

  // Process emails if provided (convert to user IDs or store as email objects)
  if (emails && typeof emails === 'string' && emails.trim() !== '') {
    // Split the comma-separated email string
    const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
    console.log('Processing emails:', emailList);

    emailList.forEach(email => {
      // Find the user with this email
      const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
                  users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        // Add the user ID to the invited list
        console.log('Found user for email:', email, user.id);
        invitedUserIds.push(user.id);
      } else {
        // For emails that don't match any registered user, store the email directly
        console.log('User not found for email, storing email object:', email);
        // Create an email object to store in invitedStudents
        assessment.invitedStudents.push({
          email: email,
          status: 'Invited',
          lastAttempt: null
        });
        notFoundEmails.push(email);
      }
    });
  } else if (emails && Array.isArray(emails) && emails.length > 0) {
    console.log('Processing email array:', emails);

    emails.forEach(email => {
      // Find the user with this email
      const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
                  users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        // Add the user ID to the invited list
        console.log('Found user for email:', email, user.id);
        invitedUserIds.push(user.id);
      } else {
        // For emails that don't match any registered user, store the email directly
        console.log('User not found for email, storing email object:', email);
        // Create an email object to store in invitedStudents
        assessment.invitedStudents.push({
          email: email,
          status: 'Invited',
          lastAttempt: null
        });
        notFoundEmails.push(email);
      }
    });
  }

  if (invitedUserIds.length === 0) {
    return res.status(400).json({
      message: 'No valid users to invite',
      notFoundEmails
    });
  }

  // Filter out users who are already invited
  const newInvites = invitedUserIds.filter(id => !assessment.invitedStudents.includes(id));

  // Add the user IDs to the invited students list
  assessment.invitedStudents = [...new Set([...assessment.invitedStudents, ...invitedUserIds])];

  // Create notifications for newly invited students
  newInvites.forEach(studentId => {
    notifications.push({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: studentId,
      type: 'invitation',
      title: 'New Assessment Invitation',
      message: `You have been invited to take the assessment: ${assessment.title}`,
      assessmentId: assessment.id,
      createdAt: new Date().toISOString(),
      read: false
    });
  });

  // Return success
  res.status(200).json({
    message: 'Students invited successfully',
    invitedCount: invitedUserIds.length,
    newInvitesCount: newInvites.length,
    notFoundEmails
  });
});

// Get notifications for the current user
app.get('/api/notifications', (req, res) => {
  // Get the user from the request (in a real app, this would be from the token)
  const userId = req.headers.authorization ? req.headers.authorization.split(' ')[1] === 'test-token' ? 'test123' : 'admin123' : null;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Return notifications for the current user
  const userNotifications = notifications.filter(notification => notification.userId === userId);
  res.json(userNotifications);
});

// Code execution routes
app.post('/api/code/execute', async (req, res) => {
  const { code, language, input } = req.body;
  console.log('Execute code request:', { language, input });

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Execute code in Docker container
    const result = await executeCode(code, language, input);

    res.json({
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed
    });
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
});

app.post('/api/code/tests/:testId/run', async (req, res) => {
  const { code, language } = req.body;
  const testId = req.params.testId;
  console.log('Run test cases request:', { testId, language });

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Get test cases for the problem
    let testCases = [];

    if (testId === '1') { // Two Sum
      testCases = [
        {
          testCaseNumber: 1,
          input: '[2, 7, 11, 15]\n9',
          expected: '[0, 1]'
        },
        {
          testCaseNumber: 2,
          input: '[3, 2, 4]\n6',
          expected: '[1, 2]'
        }
      ];
    } else if (testId === '2') { // Reverse Linked List
      testCases = [
        {
          testCaseNumber: 1,
          input: '[1, 2, 3, 4, 5]',
          expected: '[5, 4, 3, 2, 1]'
        },
        {
          testCaseNumber: 2,
          input: '[1, 2]',
          expected: '[2, 1]'
        }
      ];
    } else if (testId === '3') { // Merge K Sorted Lists
      testCases = [
        {
          testCaseNumber: 1,
          input: '[[1,4,5],[1,3,4],[2,6]]',
          expected: '[1, 1, 2, 3, 4, 4, 5, 6]'
        },
        {
          testCaseNumber: 2,
          input: '[]',
          expected: '[]'
        }
      ];
    } else { // Default test cases
      testCases = [
        {
          testCaseNumber: 1,
          input: 'Sample Input 1',
          expected: 'Expected Output 1'
        },
        {
          testCaseNumber: 2,
          input: 'Sample Input 2',
          expected: 'Expected Output 2'
        }
      ];
    }

    // Run test cases
    const results = await runTestCases(code, language, testCases);

    const passedCount = results.filter(tc => tc.passed).length;

    res.json({
      results,
      summary: {
        totalTestCases: testCases.length,
        passedTestCases: passedCount,
        failedTestCases: testCases.length - passedCount,
        status: passedCount === testCases.length ? 'Accepted' : 'Wrong Answer'
      }
    });
  } catch (error) {
    console.error('Error running test cases:', error);
    res.status(500).json({ error: 'Test execution failed' });
  }
});

app.post('/api/tests/:testId/submissions', async (req, res) => {
  const { code, language } = req.body;
  const testId = req.params.testId;
  console.log('Submit code request:', { testId, language });

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Get test cases for the problem (same as in the run test cases endpoint)
    let testCases = [];
    let testTitle = '';

    if (testId === '1') { // Two Sum
      testTitle = 'Two Sum';
      testCases = [
        {
          testCaseNumber: 1,
          input: '[2, 7, 11, 15]\n9',
          expected: '[0, 1]'
        },
        {
          testCaseNumber: 2,
          input: '[3, 2, 4]\n6',
          expected: '[1, 2]'
        }
      ];
    } else if (testId === '2') { // Reverse Linked List
      testTitle = 'Reverse Linked List';
      testCases = [
        {
          testCaseNumber: 1,
          input: '[1, 2, 3, 4, 5]',
          expected: '[5, 4, 3, 2, 1]'
        },
        {
          testCaseNumber: 2,
          input: '[1, 2]',
          expected: '[2, 1]'
        }
      ];
    } else if (testId === '3') { // Merge K Sorted Lists
      testTitle = 'Merge K Sorted Lists';
      testCases = [
        {
          testCaseNumber: 1,
          input: '[[1,4,5],[1,3,4],[2,6]]',
          expected: '[1, 1, 2, 3, 4, 4, 5, 6]'
        },
        {
          testCaseNumber: 2,
          input: '[]',
          expected: '[]'
        }
      ];
    } else {
      testTitle = 'Unknown Test';
      testCases = [
        {
          testCaseNumber: 1,
          input: 'Sample Input 1',
          expected: 'Expected Output 1'
        },
        {
          testCaseNumber: 2,
          input: 'Sample Input 2',
          expected: 'Expected Output 2'
        }
      ];
    }

    // Run test cases
    const results = await runTestCases(code, language, testCases);

    const passedCount = results.filter(tc => tc.passed).length;
    const status = passedCount === testCases.length ? 'Accepted' : 'Wrong Answer';

    // Calculate average execution time and memory usage
    const avgExecutionTime = Math.round(
      results.reduce((sum, tc) => sum + tc.executionTime, 0) / results.length
    );
    const avgMemoryUsed = Math.round(
      results.reduce((sum, tc) => sum + tc.memoryUsed, 0) / results.length
    );

    // Create submission record
    const submission = {
      _id: Math.random().toString(36).substring(7),
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@gmail.com'
      },
      test: {
        _id: testId,
        title: testTitle
      },
      code,
      language,
      status,
      testCasesPassed: passedCount,
      totalTestCases: testCases.length,
      executionTime: avgExecutionTime,
      memoryUsed: avgMemoryUsed,
      testResults: results,
      submittedAt: new Date().toISOString()
    };

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
});

app.get('/api/code/submissions', (req, res) => {
  // Always return an empty array for all users
  return res.json([]);
});

app.get('/api/code/submissions/:id', (req, res) => {
  // Simulate getting a submission by ID
  const submissionId = req.params.id;

  // In a real app, we would fetch the submission from a database
  // For now, we'll return a sample submission with test results
  res.json({
    _id: submissionId,
    user: {
      id: '123',
      name: 'Test User',
      email: 'test@gmail.com'
    },
    test: {
      _id: '1',
      title: 'Two Sum'
    },
    code: 'def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []\n\n# Read input\nnums = eval(input().strip())\ntarget = int(input().strip())\n\n# Call function and print result\nprint(two_sum(nums, target))',
    language: 'python',
    status: 'Accepted',
    testCasesPassed: 2,
    totalTestCases: 2,
    executionTime: 120,
    memoryUsed: 24,
    submittedAt: new Date(Date.now() - 3600000).toISOString(),
    testResults: [
      {
        testCaseNumber: 1,
        input: '[2, 7, 11, 15]\n9',
        expected: '[0, 1]',
        actual: '[0, 1]',
        passed: true,
        executionTime: 110,
        memoryUsed: 22
      },
      {
        testCaseNumber: 2,
        input: '[3, 2, 4]\n6',
        expected: '[1, 2]',
        actual: '[1, 2]',
        passed: true,
        executionTime: 130,
        memoryUsed: 26
      }
    ]
  });
});

// Delete a submission
app.delete('/api/code/submissions/:id', (req, res) => {
  // In a real app, we would check if the user owns this submission
  // and then delete it from the database
  console.log(`Deleting submission with ID: ${req.params.id}`);
  res.status(200).json({ message: 'Submission deleted successfully' });
});

// Delete user account
app.delete('/api/users/me', (req, res) => {
  // In a real app, we would delete the user's account and all associated data
  console.log('Deleting user account');
  res.status(200).json({ message: 'User account deleted successfully' });
});

// Default route
app.get('/', (req, res) => {
  res.send('Test Server is running');
});

// Build Docker image and start server
const PORT = 5002;

// Build Docker image for code execution
buildDockerImage()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to build Docker image:', error);
    process.exit(1);
  });

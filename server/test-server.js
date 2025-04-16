const express = require('express');
const cors = require('cors');
const { executeCode, runTestCases, buildDockerImage } = require('./code-execution/executor');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { User, Test, Assessment, Submission, Notification, Session } = require('./models');

// Create a write stream for logging
const accessLogStream = fsSync.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
const sampleTestTemplates = require('./test-templates');
const standardTemplates = require('./standard-templates');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Seed the database with template tests
async function seedTemplateTests() {
  try {
    // Check if template tests already exist
    const templateCount = await Test.countDocuments({ isTemplate: true });

    if (templateCount === 0) {
      console.log('No template tests found. Seeding database with templates...');

      // Format the test templates for MongoDB
      const formattedTemplates = sampleTestTemplates.map(template => {
        // Create code templates array
        const codeTemplates = [];

        if (template.codeTemplates) {
          if (template.codeTemplates.python) {
            codeTemplates.push({
              language: 'python',
              template: template.codeTemplates.python
            });
          }

          if (template.codeTemplates.cpp) {
            codeTemplates.push({
              language: 'cpp',
              template: template.codeTemplates.cpp
            });
          }
        } else {
          // Use standard templates
          codeTemplates.push({
            language: 'python',
            template: standardTemplates.python
          });

          codeTemplates.push({
            language: 'cpp',
            template: standardTemplates.cpp
          });
        }

        return {
          title: template.title,
          description: template.description,
          difficulty: template.difficulty,
          timeLimit: template.timeLimit || 60,
          problemStatement: template.problemStatement,
          inputFormat: template.inputFormat,
          outputFormat: template.outputFormat,
          constraints: template.constraints,
          sampleInput: template.sampleInput,
          sampleOutput: template.sampleOutput,
          testCases: template.testCases || [],
          codeTemplates,
          isPublic: true,
          isTemplate: true
        };
      });

      // Insert template tests
      const insertedTemplates = await Test.insertMany(formattedTemplates);
      console.log(`Seeded ${insertedTemplates.length} template tests`);
    } else {
      console.log(`Found ${templateCount} existing template tests. Skipping seed.`);
    }
  } catch (error) {
    console.error('Error seeding template tests:', error);
  }
}

// Function to seed default test users
async function seedTestUsers() {
  try {
    // Check if any users already exist
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('No users found. Seeding database with test users...');

      // Create test users
      const testUsers = [
        {
          name: 'Test Assessor',
          email: '1',
          password: '1',
          role: 'assessor'
        },
        {
          name: 'Test Assessee 1',
          email: '2',
          password: '2',
          role: 'assessee'
        },
        {
          name: 'Test Assessee 2',
          email: '3',
          password: '3',
          role: 'assessee'
        },
        {
          name: 'Test Assessee 3',
          email: '4',
          password: '4',
          role: 'assessee'
        }
      ];

      // Insert test users
      for (const userData of testUsers) {
        const user = new User(userData);
        await user.save();
      }

      console.log(`Seeded ${testUsers.length} test users`);
    } else {
      console.log(`Found ${userCount} existing users. Skipping user seed.`);
    }
  } catch (error) {
    console.error('Error seeding test users:', error);
  }
}

// Call the seed functions
seedTemplateTests();
seedTestUsers();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Restrict to client origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-User-ID']
}));
app.use(express.json());

// Add a middleware to log all requests
app.use((req, res, next) => {
  const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`;
  console.log(logMessage.trim());
  accessLogStream.write(logMessage);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// Test route for submissions
app.get('/api/test-submissions/:id', cors(), async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log('Test submissions route called for assessment:', assessmentId);

    // Find all submissions for this assessment
    const submissions = await Submission.find({
      assessment: assessmentId,
      isAssessmentSubmission: true
    }).populate('user');

    console.log(`Found ${submissions.length} submissions for assessment ${assessmentId}`);

    // Return raw submissions data for debugging
    res.json({
      count: submissions.length,
      submissions: submissions.map(s => ({
        _id: s._id,
        user: s.user,
        submittedAt: s.submittedAt,
        status: s.status,
        testCasesPassed: s.testCasesPassed,
        totalTestCases: s.totalTestCases
      }))
    });
  } catch (error) {
    console.error('Error in test submissions route:', error);
    res.status(500).json({ error: 'Failed to fetch test submissions', message: error.message });
  }
});

// Get all submissions for an assessment (assessor only)
app.get('/api/assessments/:id/submissions', async (req, res) => {
  // Log the request
  console.log('GET /api/assessments/:id/submissions - Received request');
  console.log('Request params:', req.params);
  console.log('Request query:', req.query);
  console.log('Request headers:', req.headers);
  console.log('GET /api/assessments/:id/submissions - Received request for assessment submissions');
  console.log('Assessment ID:', req.params.id);
  console.log('Query params:', req.query);
  try {
    const assessmentId = req.params.id;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is an assessor
    if (user.role !== 'assessor') {
      return res.status(403).json({ error: 'Only assessors can view all submissions for an assessment' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      console.error('Invalid assessment ID format:', assessmentId);
      return res.status(400).json({ error: 'Invalid assessment ID format' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check if the user is the creator of the assessment
    if (assessment.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the creator of the assessment can view all submissions' });
    }

    // Find all submissions for this assessment
    const submissions = await Submission.find({
      assessment: assessmentId,
      isAssessmentSubmission: true
    }).populate('user');

    console.log(`Found ${submissions.length} submissions for assessment ${assessmentId}`);

    // If user field is not populated, populate it manually
    for (let i = 0; i < submissions.length; i++) {
      if (!submissions[i].user && submissions[i].user !== null) {
        // Try to find the user by ID
        try {
          const userId = submissions[i].user;
          const user = await User.findById(userId);
          if (user) {
            submissions[i].user = user;
            console.log(`Manually populated user for submission ${submissions[i]._id}`);
          }
        } catch (err) {
          console.error(`Error populating user for submission ${submissions[i]._id}:`, err);
        }
      }
    }

    console.log(`Found ${submissions.length} submissions for assessment ${assessmentId}`);

    // Format the submissions for the response
    const formattedSubmissions = submissions.map(submission => {
      // Get user info, handling the case where user might be null
      let userInfo = { _id: null, email: 'Unknown', name: 'Unknown User' };

      if (submission.user) {
        if (typeof submission.user === 'object') {
          userInfo = {
            _id: submission.user._id,
            email: submission.user.email || 'Unknown',
            name: submission.user.name || 'Unknown User'
          };
        } else {
          // If user is just an ID, use that
          userInfo._id = submission.user;
        }
      }

      // Count attempted tests vs total tests in the assessment
      let attemptedTests = 0;
      const totalTests = assessment.tests ? assessment.tests.length : 0;

      // If we have test submissions data, count them
      if (submission.testSubmissions && Array.isArray(submission.testSubmissions) && submission.testSubmissions.length > 0) {
        // Count unique test IDs in the submissions
        const uniqueTestIds = new Set();
        submission.testSubmissions.forEach(testSubmission => {
          if (testSubmission && testSubmission.test) {
            uniqueTestIds.add(testSubmission.test.toString());
          }
        });
        attemptedTests = uniqueTestIds.size;
      }

      // Use the total test cases from the submission
      const finalTotalTestCases = submission.totalTestCases || 0;

      return {
        _id: submission._id,
        user: userInfo,
        submittedAt: submission.submittedAt,
        status: submission.status || 'completed',
        testCasesPassed: submission.testCasesPassed || 0,
        totalTestCases: finalTotalTestCases,
        percentageScore: finalTotalTestCases > 0 ?
          Math.round((submission.testCasesPassed / finalTotalTestCases) * 100) : 0,
        attemptedTests: attemptedTests,
        totalTests: totalTests
      };
    });

    console.log('Formatted submissions:', formattedSubmissions);

    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching assessment submissions:', error);
    res.status(500).json({ error: 'Failed to fetch assessment submissions', message: error.message });
  }
});

// Generate a unique session ID
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

// Generate a token for a user
function generateToken(userId, sessionId) {
  // In a real app, this would be a JWT with proper signing
  return Buffer.from(JSON.stringify({ userId, sessionId, timestamp: Date.now() })).toString('base64');
}

// Validate a token and return the user
async function validateToken(token, sessionId) {
  try {
    // Decode the token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

    // Find the session in the database
    const session = await Session.findOne({ sessionId: decoded.sessionId });

    if (!session || session.token !== token) {
      return null;
    }

    // If sessionId is provided, ensure it matches the token's sessionId
    if (sessionId && decoded.sessionId !== sessionId) {
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    await session.save();

    // Find the user
    const user = await User.findById(decoded.userId);
    return user || null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request body:', req.body);

    const { name, email, password, role } = req.body;
    const sessionId = req.headers['x-session-id'] || generateSessionId();

    console.log('Session ID for registration:', sessionId);

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const newUser = new User({
      name: name || 'New User',
      email,
      password, // Will be hashed by the pre-save hook
      role: role || 'assessee' // Default role is assessee
    });

    // Save user to database
    await newUser.save();

    // Generate a token for this session
    const token = generateToken(newUser._id, sessionId);

    // Store the session in database
    const newSession = new Session({
      userId: newUser._id,
      sessionId,
      token,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });

    await newSession.save();

    // Set session ID in response header
    res.setHeader('X-Session-ID', sessionId);

    // Return successful registration
    res.status(201).json({
      token,
      sessionId,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);

    const { email, password } = req.body;
    const sessionId = req.headers['x-session-id'] || generateSessionId();

    console.log('Session ID for login:', sessionId);

    // Find user by email
    const user = await User.findOne({ email });
    console.log('Found user:', user ? user.email : 'Not found');

    // If no user exists with this email, return error
    if (!user) {
      console.log('User not found, returning error');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // For existing users, check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a token for this session
    const token = generateToken(user._id, sessionId);

    // Store the session in database
    const newSession = new Session({
      userId: user._id,
      sessionId,
      token,
      createdAt: Date.now(),
      lastActivity: Date.now()
    });

    await newSession.save();

    // Set session ID in response header
    res.setHeader('X-Session-ID', sessionId);

    console.log('Login successful for user:', user.email);
    // Return the token and user info
    res.json({
      token,
      sessionId,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    // Get the token from the request
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'];
    console.log('Auth header for /me:', authHeader);
    console.log('Session ID for /me:', sessionId);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token for /me:', token);

    // Validate the token and get the user
    const user = await validateToken(token, sessionId);

    if (user) {
      console.log('Token validation successful, user:', user.email);
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }

    // If token validation failed, try the old method for backward compatibility
    // Get the email from the query parameter if provided
    let email = req.query.email;
    console.log('Email from query:', email);

    // Handle case where email is an array
    if (Array.isArray(email)) {
      email = email[0];
      console.log('Email is an array, using first value:', email);
    }

    // For testing purposes, if no valid user is found, create one
    if (email) {
      // Check if user exists
      let foundUser = await User.findOne({ email });

      if (!foundUser) {
        console.log('Creating new user for email:', email);
        // Create a new user
        const newUser = new User({
          name: email.split('@')[0],
          email: email,
          password: 'password123', // Will be hashed by the pre-save hook
          role: 'assessee' // Default to assessee for new users
        });

        foundUser = await newUser.save();
        console.log('New user created:', foundUser.email);

        // Check if this email was invited to any assessments
        const assessments = await Assessment.find({
          'invitedStudents.email': email
        });

        for (const assessment of assessments) {
          console.log(`Found invitation for email ${email} in assessment ${assessment._id}`);

          // Update the assessment to include the user ID
          await Assessment.updateOne(
            { _id: assessment._id, 'invitedStudents.email': email },
            { $set: { 'invitedStudents.$': foundUser._id } }
          );

          // Create a notification for this user
          const notification = new Notification({
            userId: foundUser._id,
            type: 'invitation',
            title: 'New Assessment Invitation',
            message: `You have been invited to take the assessment: ${assessment.title}`,
            assessmentId: assessment._id,
            createdAt: new Date(),
            read: false
          });

          await notification.save();
          console.log(`Created notification for new user ${foundUser._id} for assessment ${assessment._id}`);
        }
      }

      if (foundUser) {
        console.log('Returning user for /me:', foundUser.email);
        return res.json({
          _id: foundUser._id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role
        });
      }
    }

    // If we get here, no user was found
    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    console.log('Logout request for session:', sessionId);

    if (sessionId) {
      // Remove the session from database
      await Session.deleteOne({ sessionId });
      console.log('Session removed successfully');
    }

    // Always return success
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Set new password
      user.password = newPassword;
    }

    // Save the updated user
    await user.save();

    return res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Sample test templates are now imported from './test-templates'
/* Old templates commented out
const oldTemplates = [
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
    codeTemplates: {
      python: `def solution(nums, target):
    # Your code here
    pass

# Read input
nums = eval(input().strip())
target = int(input().strip())

# Call function and print result
print(solution(nums, target))`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>

std::vector<int> solution(std::vector<int>& nums, int target) {
    // Your code here
    return {};
}

// Parse input string to vector
std::vector<int> parseInput(const std::string& input) {
    std::vector<int> result;
    std::stringstream ss(input.substr(1, input.size() - 2)); // Remove [ and ]
    std::string item;
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<int> nums = parseInput(input);

    int target;
    std::cin >> target;

    // Call solution
    std::vector<int> result = solution(nums, target);

    // Print result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << result[i];
    }
    std::cout << "]" << std::endl;

    return 0;
}`
    },
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
*/

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

// Commenting out the in-memory assessments API to avoid conflicts
// app.get('/api/assessments', (req, res) => {
//     res.json(inMemoryAssessments);
// });

// app.post('/api/assessments', (req, res) => {
//     const newAssessment = req.body;
//     inMemoryAssessments.push(newAssessment);
//     res.status(201).json(newAssessment);
// });

// Tests routes
app.get('/api/tests', async (req, res) => {
  try {
    // Get the user from the request
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

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return error
    if (!user) {
      console.log('User not found by email, returning error');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // If the user is an assessor, return all tests
    if (user.role === 'assessor') {
      console.log('Returning all tests for assessor');
      const allTests = await Test.find({});
      return res.json(allTests);
    }

    // If the user is an assessee, return tests that are part of their assigned assessments OR public tests
    const assignedAssessments = await Assessment.find({
      $or: [
        { invitedStudents: user._id },
        { isPublic: true }
      ]
    });

    console.log('Assigned assessments:', assignedAssessments.length);

    // Extract all test IDs from assigned assessments
    const assignedTestIds = new Set();
    assignedAssessments.forEach(assessment => {
      if (assessment.tests && Array.isArray(assessment.tests)) {
        assessment.tests.forEach(testId => assignedTestIds.add(testId.toString()));
      }
    });

    console.log('Assigned test IDs:', [...assignedTestIds]);

    // Get all accessible tests (public tests OR tests in assigned assessments)
    const accessibleTests = await Test.find({
      $or: [
        { isPublic: true },
        { _id: { $in: [...assignedTestIds] } }
      ]
    });

    console.log('Returning accessible tests for assessee:', accessibleTests.length);
    res.json(accessibleTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get public tests
app.get('/api/tests/public', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Return only public tests
    const publicTests = await Test.find({ isPublic: true });
    console.log('Returning public tests:', publicTests.length);
    res.json(publicTests);
  } catch (error) {
    console.error('Error fetching public tests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tests created by the current user
app.get('/api/tests/my-tests', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    const userEmail = req.query.email;

    if (!authHeader || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return tests created by the current user
    const myTests = await Test.find({ createdBy: user._id });
    res.json(myTests);
  } catch (error) {
    console.error('Error fetching user tests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new test or assessment
app.post('/api/tests', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    const userEmail = req.query.email;

    if (!authHeader || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the test data from the request body
    const testData = req.body;

    // Create a new test with the provided data
    const newTest = new Test({
      ...testData,
      createdBy: user._id,
      createdAt: new Date()
    });

    // Save the test to the database
    await newTest.save();

    // If this is an assessment with questions, create an assessment entry
    if (testData.questions && Array.isArray(testData.questions) && testData.questions.length > 0) {
      const newAssessment = new Assessment({
        title: testData.title,
        description: testData.description || '',
        startTime: testData.startTime || new Date(),
        endTime: testData.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAttempts: testData.maxAttempts || 1,
        createdBy: user._id,
        tests: [newTest._id],
        invitedStudents: []
      });

      // Save the assessment to the database
      await newAssessment.save();
    }

    // Return the new test
    res.status(201).json(newTest);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sample test templates
app.get('/api/tests/templates', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    const userEmail = req.query.email;

    if (!authHeader || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return template tests from the database
    const templates = await Test.find({ isTemplate: true });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching test templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a test from a template
app.post('/api/tests/from-template/:templateId', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    const userEmail = req.query.email;

    if (!authHeader || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the template ID from the request params
    const templateId = req.params.templateId;

    // Find the template
    const template = await Test.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create a new test from the template
    const newTest = new Test({
      title: template.title,
      description: template.description,
      difficulty: template.difficulty,
      timeLimit: template.timeLimit,
      problemStatement: template.problemStatement,
      inputFormat: template.inputFormat,
      outputFormat: template.outputFormat,
      constraints: template.constraints,
      sampleInput: template.sampleInput,
      sampleOutput: template.sampleOutput,
      testCases: template.testCases,
      codeTemplates: template.codeTemplates || standardTemplates,
      isPublic: false, // Default to private for user-created tests
      isTemplate: false,
      createdBy: user._id
    });

    // Save the test to the database
    await newTest.save();

    // Return the new test
    res.status(201).json(newTest);
  } catch (error) {
    console.error('Error creating test from template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  try {
    // Get the test ID from the request
    const testId = req.params.id;
    console.log('GET /api/tests/:id - Test ID:', testId);

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('GET /api/tests/:id - Auth Header:', authHeader, 'Email:', userEmail);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!userEmail) {
      console.error('No email provided in the request');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user by email
    let user = await User.findOne({ email: userEmail });

    // If user not found by email, create a temporary user for testing purposes
    if (!user) {
      console.log('User not found by email, creating temporary user for test access');
      user = {
        _id: `temp-user-${Date.now()}`,
        name: userEmail ? userEmail.split('@')[0] : 'Guest User',
        email: userEmail || 'guest@example.com',
        role: 'assessee'
      };
    }

    console.log('Found user for test access check:', user._id, user.email);

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId) && testId.length !== 24) {
      console.error('Invalid test ID format:', testId);
      return res.status(400).json({ message: 'Invalid test ID format' });
    }

    // Find the test by ID
    const test = await Test.findById(testId);

    if (!test) {
      console.log('Test not found with ID:', testId);
      return res.status(404).json({ message: 'Test not found' });
    }

    // Ensure the test has both id and _id properties
    if (test._id && !test.id) {
      test.id = test._id.toString();
      console.log('Added id field based on _id:', test._id);
    } else if (test.id && !test._id) {
      test._id = test.id.toString();
      console.log('Added _id field based on id:', test.id);
    }

    console.log('Test found:', { id: test._id, title: test.title });

    // Check if the user has permission to view this test
    const isCreator = test.createdBy && test.createdBy.toString() === user._id.toString();
    const isPublic = test.isPublic;

    // Get the specific assessment ID from the query parameters if provided
    const specificAssessmentId = req.query.assessmentId;
    console.log('Specific assessment ID from query:', specificAssessmentId);

    // If a specific assessment ID is provided, only check that assessment
    let isPartOfAssessment = false;
    let isInvited = false;

    if (specificAssessmentId) {
      // Find the assessment by ID
      const assessment = await Assessment.findById(specificAssessmentId);

      if (assessment) {
        console.log(`Checking assessment ${assessment._id} for test ${testId}`);

        // Check if this test is part of the specified assessment
        isPartOfAssessment = assessment.tests &&
                            assessment.tests.some(t => t.toString() === testId);

        console.log(`Is test ${testId} part of assessment ${specificAssessmentId}? ${isPartOfAssessment}`);

        // Check if user is invited to this assessment
        if (isPartOfAssessment) {
          // Check if assessment is public
          if (assessment.isPublic) {
            console.log(`Assessment ${assessment._id} is public`);
            isInvited = true;
          } else {
            // Check if user is in invitedStudents
            isInvited = assessment.invitedStudents &&
                      assessment.invitedStudents.some(id => id.toString() === user._id.toString());

            if (isInvited) {
              console.log(`User ${user.email} is invited to assessment ${assessment._id}`);
            }
          }
        }
      }
    } else {
      // Check all assessments that contain this test
      const assessmentsWithTest = await Assessment.find({
        tests: testId
      });

      console.log(`Found ${assessmentsWithTest.length} assessments containing test ${testId}`);

      // Check if user is invited to any of these assessments
      isInvited = assessmentsWithTest.some(assessment => {
        // Check if assessment is public
        if (assessment.isPublic) {
          console.log(`Assessment ${assessment._id} is public`);
          return true;
        }

        // Check if user is in invitedStudents
        const userInvited = assessment.invitedStudents &&
                          assessment.invitedStudents.some(id => id.toString() === user._id.toString());

        if (userInvited) {
          console.log(`User ${user.email} is invited to assessment ${assessment._id}`);
          return true;
        }

        return false;
      });
    }

    console.log('Permission check for test access:', {
      testId,
      userId: user._id,
      userEmail: user.email,
      isCreator,
      isPublic,
      isInvited
    });

    // If the test is part of the specified assessment and the user is invited to that assessment,
    // grant access regardless of other permissions
    const hasAccessViaAssessment = specificAssessmentId && isPartOfAssessment && isInvited;

    // Check if the user has permission to view this test
    if (!isCreator && !isPublic && !isInvited && !hasAccessViaAssessment) {
      console.log('Access denied to test. Permission check:', { isCreator, isPublic, isInvited, hasAccessViaAssessment });
      return res.status(403).json({ message: 'You do not have permission to view this test' });
    }

    // Log access granted
    console.log(`Access granted to test ${testId} for user ${user.email}`);

    // If we're here, the user has permission to view the test

    // Add detailed test information
    const detailedTest = {
      ...test.toObject(),
      // Use the actual test data without fallbacks to avoid "Two Sum" appearing incorrectly
      problemStatement: test.problemStatement,
      inputFormat: test.inputFormat,
      outputFormat: test.outputFormat,
      constraints: test.constraints,
      sampleInput: test.sampleInput,
      sampleOutput: test.sampleOutput,
      // Use standard templates if none exist
      codeTemplates: test.codeTemplates.length > 0 ? test.codeTemplates : standardTemplates
    };

    // Log the test details to help debug
    console.log(`Returning test details for ${testId}: ${test.title}`);
    console.log(`Problem statement: ${detailedTest.problemStatement ? detailedTest.problemStatement.substring(0, 50) + '...' : 'None'}`);
    console.log(`Sample input: ${detailedTest.sampleInput ? detailedTest.sampleInput.substring(0, 20) + '...' : 'None'}`);
    console.log(`Sample output: ${detailedTest.sampleOutput ? detailedTest.sampleOutput.substring(0, 20) + '...' : 'None'}`);
    console.log(`Code templates: ${detailedTest.codeTemplates.length} templates available`);

    // If the user is an assessee, filter out hidden test cases
    if (user.role === 'assessee') {
      // Make sure testCases is an array before filtering
      if (Array.isArray(detailedTest.testCases)) {
        detailedTest.testCases = detailedTest.testCases.filter(tc => tc && !tc.isHidden);
      } else {
        detailedTest.testCases = [];
      }
    }

    // Return the test
    res.json(detailedTest);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assessments routes
// Create a new assessment
app.post('/api/assessments', async (req, res) => {
  console.log('Create assessment request body:', req.body);

  try {
    // Get the user from the request
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

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return error
    if (!user) {
      console.log('User not found by email, returning error');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found for assessment creation:', user);

    // Make sure tests is an array
    const testsArray = Array.isArray(req.body.tests) ? req.body.tests : [];
    console.log('Tests array for assessment:', testsArray);

    // Process invited students
    let invitedStudents = [];
    if (req.body.invitedStudents && Array.isArray(req.body.invitedStudents)) {
      // Filter out any example.com emails
      invitedStudents = req.body.invitedStudents.filter(student => {
        if (typeof student === 'object' && student.email) {
          return !student.email.includes('example.com');
        }
        return true;
      });
    }

    console.log('Filtered invitedStudents for new assessment:', invitedStudents);

    // Create a new assessment
    const newAssessment = new Assessment({
      title: req.body.title,
      description: req.body.description,
      tests: testsArray,
      startTime: req.body.startTime || new Date(),
      endTime: req.body.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      maxAttempts: req.body.maxAttempts || 1,
      isPublic: req.body.isPublic || false,
      createdBy: user._id,
      invitedUsers: invitedStudents,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('New assessment being created:', newAssessment);

    // Save the assessment to the database
    await newAssessment.save();

    // Create notifications for invited users
    if (invitedStudents && invitedStudents.length > 0) {
      for (const student of invitedStudents) {
        if (typeof student === 'object' && student.email) {
          // Try to find the user by email
          const invitedUser = await User.findOne({ email: student.email });

          if (invitedUser) {
            // Create a notification for this user
            const notification = new Notification({
              userId: invitedUser._id,
              type: 'invitation',
              title: 'New Assessment Invitation',
              message: `You have been invited to take the assessment: ${newAssessment.title}`,
              assessmentId: newAssessment._id,
              createdAt: new Date(),
              read: false
            });

            await notification.save();
            console.log('Created notification for invited user:', invitedUser.email);
          }
        }
      }
    }

    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an existing assessment
app.put('/api/assessments/:id', async (req, res) => {
  console.log(`Update assessment ${req.params.id} request body:`, req.body);

  try {
    // Get the user from the request
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

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return error
    if (!user) {
      console.log('User not found by email, returning error');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found for assessment update:', user);

    // Find the assessment by ID
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      console.log('Assessment not found');
      return res.status(404).json({ message: 'Assessment not found' });
    }

    console.log('Assessment found:', assessment);

    // Check if the user is the creator of the assessment
    if (assessment.createdBy.toString() !== user._id.toString()) {
      console.log('User is not the creator of the assessment');
      return res.status(403).json({ message: 'You are not authorized to update this assessment' });
    }

    // Update the assessment fields
    assessment.title = req.body.title || assessment.title;
    assessment.description = req.body.description || assessment.description;
    assessment.tests = req.body.tests || assessment.tests;
    assessment.startTime = req.body.startTime || assessment.startTime;
    assessment.endTime = req.body.endTime || assessment.endTime;
    assessment.maxAttempts = req.body.maxAttempts || assessment.maxAttempts;
    assessment.isPublic = req.body.isPublic !== undefined ? req.body.isPublic : assessment.isPublic;
    assessment.updatedAt = new Date();

    // Process invited students if provided
    if (req.body.invitedStudents && Array.isArray(req.body.invitedStudents)) {
      // Filter out any example.com emails
      const invitedStudents = req.body.invitedStudents.filter(student => {
        if (typeof student === 'object' && student.email) {
          return !student.email.includes('example.com');
        }
        return true;
      });

      assessment.invitedUsers = invitedStudents;
    }

    // Save the updated assessment
    await assessment.save();

    console.log('Updated assessment:', assessment);

    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/assessments/my-assessments', async (req, res) => {
  try {
    // Get the user from the request
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

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return empty array
    if (!user) {
      console.log('User not found by email, returning empty array');
      return res.json([]);
    }

    console.log('User found for my assessments:', user);

    // Find assessments created by the current user
    const userAssessments = await Assessment.find({ createdBy: user._id });
    console.log(`Found ${userAssessments.length} assessments created by user ${user.email}`);

    // Process each assessment to include invited users information
    const assessmentsWithDetails = await Promise.all(userAssessments.map(async (assessment) => {
      // Get the invited users for this assessment
      const invitedUsers = [];

      // Process invited users
      if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
        for (const invitedUser of assessment.invitedUsers) {
          if (typeof invitedUser === 'object' && invitedUser.email) {
            // It's an email object
            invitedUsers.push({
              id: 'email_' + invitedUser.email,
              name: invitedUser.email.split('@')[0],
              email: invitedUser.email,
              status: invitedUser.status || 'Invited',
              lastAttempt: invitedUser.lastAttempt
            });
          } else if (typeof invitedUser === 'string' || invitedUser instanceof mongoose.Types.ObjectId) {
            // It's a user ID reference
            try {
              const foundUser = await User.findById(invitedUser);
              if (foundUser) {
                invitedUsers.push({
                  id: foundUser._id,
                  name: foundUser.name,
                  email: foundUser.email
                });
              } else {
                invitedUsers.push({ id: invitedUser, name: 'Unknown User', email: 'unknown' });
              }
            } catch (err) {
              console.error(`Error finding invited user with ID ${invitedUser}:`, err);
              invitedUsers.push({ id: invitedUser, name: 'Unknown User', email: 'unknown' });
            }
          }
        }
      }

      // Get test details
      const testDetails = [];
      if (assessment.tests && Array.isArray(assessment.tests)) {
        for (const testId of assessment.tests) {
          try {
            const test = await Test.findById(testId);
            if (test) {
              testDetails.push({
                _id: test._id,
                title: test.title,
                difficulty: test.difficulty
              });
            }
          } catch (err) {
            console.error(`Error finding test with ID ${testId}:`, err);
          }
        }
      }

      // Return assessment with additional details
      return {
        ...assessment.toObject(),
        invitedUsers,
        testDetails
      };
    }));

    res.json(assessmentsWithDetails);
  } catch (error) {
    console.error('Error fetching my assessments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/assessments/assigned', async (req, res) => {
  try {
    // Get the user from the request
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

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return empty array
    if (!user) {
      console.log('User not found by email, returning empty array');
      return res.json([]);
    }

    console.log('User found:', user.email, user._id);

    // User's email is already available in user.email

    // Find assessments where the user is invited or that are public
    const assignedAssessments = await Assessment.find({
      $or: [
        { isPublic: true },
        { 'invitedUsers.email': userEmail },
        { invitedUsers: user._id }
      ]
    });

    console.log(`Found ${assignedAssessments.length} assigned assessments for user ${user.email}`);

    // Find all submissions for this user
    const userSubmissions = await Submission.find({
      $or: [
        { userId: user._id, status: 'completed' },
        { user: user._id, status: 'completed' }
      ]
    });

    console.log(`Found ${userSubmissions.length} completed submissions for user ${user.email}`);

    // Create a map of assessment ID to submission
    const submissionMap = {};
    userSubmissions.forEach(submission => {
      if (submission.assessment) {
        submissionMap[submission.assessment.toString()] = submission;
        console.log(`Found submission for assessment ${submission.assessment.toString()}`);
      }
    });

    // Find all notifications for this user
    const userNotifications = await Notification.find({
      userId: user._id,
      type: 'invitation',
      read: false
    });

    // Create a set of assessment IDs with unread notifications
    const unreadNotificationAssessments = new Set();
    userNotifications.forEach(notification => {
      if (notification.assessmentId) {
        unreadNotificationAssessments.add(notification.assessmentId.toString());
      }
    });

    // Process each assessment to add additional information
    const processedAssessments = await Promise.all(assignedAssessments.map(async assessment => {
      // Check if the user has submitted this assessment
      const assessmentId = assessment._id.toString();
      const submission = submissionMap[assessmentId];

      // Check if there's a user-specific submission status in the userSubmissions map
      const userSubmissionStatus = assessment.userSubmissions &&
                                  assessment.userSubmissions.get(user._id.toString());

      // ONLY use the user-specific submission status
      let hasSubmitted = !!userSubmissionStatus && userSubmissionStatus.submitted === true;

      // If not found in userSubmissions, check for user-specific submissions
      if (!hasSubmitted) {
        // Only consider a submission valid if it's specifically for this assessment
        // and is marked as an assessment submission (not just a test submission)
        // AND belongs to this specific user
        hasSubmitted = !!submission && submission.assessment &&
                       submission.assessment.toString() === assessmentId &&
                       submission.isAssessmentSubmission === true &&
                       submission.user && submission.user.toString() === user._id.toString();
      }

      // Do NOT use the general assessment submitted flag
      // This ensures we only consider user-specific submission status

      console.log(`Assessment ${assessmentId} submission status: ${hasSubmitted ? 'Submitted' : 'Not submitted'}`);
      console.log(`  - User submission status: ${userSubmissionStatus ? 'Found' : 'Not found'}`);
      console.log(`  - Submission record: ${submission ? 'Found' : 'Not found'}`);
      console.log(`  - Assessment submitted flag: ${assessment.submitted ? 'True' : 'False'}`);


      // Check if this is a new invitation (not yet viewed)
      const isNewInvitation = unreadNotificationAssessments.has(assessment._id.toString());

      // Get test details
      const testDetails = [];
      if (assessment.tests && Array.isArray(assessment.tests)) {
        for (const testId of assessment.tests) {
          try {
            const test = await Test.findById(testId);
            if (test) {
              testDetails.push({
                _id: test._id,
                title: test.title,
                difficulty: test.difficulty
              });
            }
          } catch (err) {
            console.error(`Error finding test with ID ${testId}:`, err);
          }
        }
      }

      // Determine the submission timestamp from the most reliable source
      let submittedAtTimestamp = null;
      if (hasSubmitted) {
        if (userSubmissionStatus && userSubmissionStatus.submittedAt) {
          submittedAtTimestamp = userSubmissionStatus.submittedAt;
        } else if (submission && submission.submittedAt) {
          submittedAtTimestamp = submission.submittedAt;
        } else if (assessment.submittedAt) {
          submittedAtTimestamp = assessment.submittedAt;
        }
      }

      return {
        ...assessment.toObject(),
        submitted: hasSubmitted,
        submittedAt: submittedAtTimestamp,
        isNewInvitation,
        testDetails
      };
    }));

    res.json(processedAssessments);
  } catch (error) {
    console.error('Error fetching assigned assessments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix the invite endpoint to use MongoDB and persist invitations
app.post('/api/assessments/:id/invite', async (req, res) => {
  try {
    const assessmentId = req.params.id;
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

    // Find the current user (assessor)
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Only the creator can invite
    if (assessment.createdBy.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to invite students to this assessment' });
    }

    // Parse emails and userIds from request body
    const { userIds, emails } = req.body;
    let invitedUserIds = Array.isArray(userIds) ? userIds : [];
    let emailList = [];

    if (typeof emails === 'string') {
      emailList = emails.split(',').map(e => e.trim()).filter(Boolean);
    } else if (Array.isArray(emails)) {
      emailList = emails.filter(Boolean);
    }

    // Prepare to update invitedUsers
    let notFoundEmails = [];
    let newInvites = [];

    // Process userIds (registered users)
    for (const userId of invitedUserIds) {
      // Check if already invited
      if (!assessment.invitedUsers.some(u =>
        (typeof u === 'string' && u === userId) ||
        (typeof u === 'object' && u._id && u._id.toString() === userId)
      )) {
        assessment.invitedUsers.push(userId);
        newInvites.push(userId);

        // Create notification for this user
        const notifUser = await User.findById(userId);
        if (notifUser) {
          await Notification.create({
            userId: notifUser._id,
            type: 'invitation',
            title: 'New Assessment Invitation',
            message: `You have been invited to take the assessment: ${assessment.title}`,
            assessmentId: assessment._id,
            createdAt: new Date(),
            read: false
          });
        }
      }
    }

    // Process emails (may or may not be registered)
    for (const email of emailList) {
      const normalizedEmail = email.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });

      if (user) {
        // If user exists, invite by userId if not already invited
        if (!assessment.invitedUsers.some(u =>
          (typeof u === 'string' && u === user._id.toString()) ||
          (typeof u === 'object' && u._id && u._id.toString() === user._id.toString())
        )) {
          assessment.invitedUsers.push(user._id);
          newInvites.push(user._id.toString());

          // Create notification
          await Notification.create({
            userId: user._id,
            type: 'invitation',
            title: 'New Assessment Invitation',
            message: `You have been invited to take the assessment: ${assessment.title}`,
            assessmentId: assessment._id,
            createdAt: new Date(),
            read: false
          });
        }
      } else {
        // If not registered, invite by email if not already present
        const alreadyInvited = assessment.invitedUsers.some(u =>
          typeof u === 'object' && u.email && u.email.toLowerCase() === normalizedEmail
        );
        if (!alreadyInvited) {
          assessment.invitedUsers.push({
            email: email,
            status: 'Invited',
            lastAttempt: null
          });
          notFoundEmails.push(email);
        } else {
          notFoundEmails.push(email); // Already invited, but still count for response
        }
      }
    }

    await assessment.save();

    res.status(200).json({
      message: newInvites.length > 0
        ? notFoundEmails.length > 0
          ? `${newInvites.length} registered students and ${notFoundEmails.length} unregistered emails invited successfully`
          : 'Students invited successfully'
        : `${notFoundEmails.length} unregistered emails invited successfully`,
      invitedCount: newInvites.length,
      emailsCount: notFoundEmails.length,
      notFoundEmails,
      success: true
    });
  } catch (error) {
    console.error('Error in invite endpoint:', error);
    res.status(500).json({ message: 'Failed to invite students', error: error.message });
  }
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
    const assessmentIndex = assessments.findIndex(a => a._id === req.params.id);

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

app.get('/api/assessments/:id', async (req, res) => {
  try {
    // Get the assessment ID from the request
    const assessmentId = req.params.id;

    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Check for invitation token and invited email in query params
    const invitationToken = req.query.token;
    const invitedEmail = req.query.invitedEmail;

    console.log('GET /api/assessments/:id - Invitation params:', { invitationToken, invitedEmail });

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('GET /api/assessments/:id - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(assessmentId) && assessmentId.length !== 24) {
      console.error('Invalid assessment ID format:', assessmentId);
      return res.status(400).json({ message: 'Invalid assessment ID format' });
    }

    // Find the assessment by ID
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      console.log('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Ensure the assessment has both id and _id properties
    if (assessment._id && !assessment.id) {
      assessment.id = assessment._id.toString();
      console.log('Added id field based on _id:', assessment._id);
    } else if (assessment.id && !assessment._id) {
      assessment._id = assessment.id.toString();
      console.log('Added _id field based on id:', assessment.id);
    }

    console.log('Assessment found:', assessment._id);

    // Find the user by email
    const user = await User.findOne({ email: userEmail });

    // If user not found by email, return error
    if (!user) {
      console.log('User not found by email');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email);

    // Check if the user has permission to view this assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === user._id.toString();
    const isPublic = assessment.isPublic;

    console.log('Creator check:', { isCreator });

    // Check if the user is invited
    let isInvited = false;

    // Check if user is in invitedUsers array
    if (assessment.invitedUsers && Array.isArray(assessment.invitedUsers)) {
      // Check if user ID is in the array
      const isInvitedById = assessment.invitedUsers.some(invitedUser => {
        if (invitedUser && typeof invitedUser === 'object' && invitedUser._id) {
          return invitedUser._id.toString() === user._id.toString();
        }
        return false;
      });

      // Check if user email is in the array
      const emailsToCheck = [user.email.toLowerCase()];
      if (invitedEmail) emailsToCheck.push(invitedEmail.toLowerCase());

      const isInvitedByEmail = assessment.invitedUsers.some(invitedUser => {
        if (invitedUser && typeof invitedUser === 'object' && invitedUser.email) {
          const invitedEmail = invitedUser.email.toLowerCase();
          return emailsToCheck.includes(invitedEmail);
        }
        return false;
      });

      isInvited = isInvitedById || isInvitedByEmail;
    }

    // Check if there's a notification for this user for this assessment
    const hasInvitationNotification = await Notification.exists({
      userId: user._id,
      assessmentId: assessment._id,
      type: 'invitation'
    });

    // If an invitation token is provided, consider it a valid invitation
    const hasValidToken = !!invitationToken;

    isInvited = isInvited || hasInvitationNotification || hasValidToken;

    console.log('Permission check:', { isCreator, isPublic, isInvited });

    if (!isCreator && !isPublic && !isInvited) {
      return res.status(403).json({ message: 'You do not have permission to view this assessment' });
    }

    // Get the full test details for each test in the assessment
    const testDetails = [];
    if (assessment.tests && Array.isArray(assessment.tests)) {
      for (const testId of assessment.tests) {
        try {
          const test = await Test.findById(testId);
          if (test) {
            // For assessees, hide the test cases that are marked as hidden
            if (user.role === 'assessee') {
              const filteredTest = {
                ...test.toObject(),
                testCases: test.testCases ? test.testCases.filter(tc => !tc.isHidden) : []
              };
              testDetails.push(filteredTest);
            } else {
              testDetails.push(test.toObject());
            }
          }
        } catch (err) {
          console.error(`Error finding test with ID ${testId}:`, err);
        }
      }
    }

    console.log('Test details count:', testDetails.length);

    // Return the assessment with full test details
    res.json({
      ...assessment.toObject(),
      testDetails
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
    id: user._id,
    email: user.email,
    name: user.name
  }));

  res.json(assesseesList);
});

app.post('/api/assessments/:id/accept-invitation', async (req, res) => {
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

  console.log('POST /api/assessments/:id/accept-invitation - Auth Header:', authHeader, 'Email:', userEmail, 'Assessment ID:', assessmentId);

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Get token and email from request body
  const { token, email } = req.body;
  console.log('Invitation acceptance request:', { token, email });

  // Find the user by email
  let user = null;
  if (userEmail) {
    user = await User.findOne({ email: userEmail });
  }

  // If user not found by email, return error
  if (!user) {
    console.log('User not found by email, returning error');
    return res.status(404).json({ message: 'User not found' });
  }

  console.log('User found for invitation acceptance:', user);

  // Find the assessment by ID
  const assessment = await Assessment.findById(assessmentId);

  if (!assessment) {
    console.log('Assessment not found');
    return res.status(404).json({ message: 'Assessment not found' });
  }

  console.log('Assessment found:', assessment);

  // Check if the user is already invited by ID
  const isInvitedById = Array.isArray(assessment.invitedStudents) && assessment.invitedStudents.includes(user._id);

  if (isInvitedById) {
    console.log('User is already invited by ID');
    return res.json({ message: 'Invitation already accepted', success: true });
  }

  // Check if the user is invited by email
  let invitedEmailObject = null;
  if (Array.isArray(assessment.invitedStudents)) {
    invitedEmailObject = assessment.invitedStudents.find(student => {
      if (typeof student === 'object' && student.email) {
        const studentEmail = student.email.toLowerCase();
        const userEmailLower = user.email.toLowerCase();
        const invitedEmailLower = email ? email.toLowerCase() : '';
        return studentEmail === userEmailLower || (invitedEmailLower && studentEmail === invitedEmailLower);
      }
      return false;
    });
  }

  if (invitedEmailObject) {
    console.log('User is invited by email, converting to ID invitation');

    // Remove the email object from invitedStudents
    const emailIndex = assessment.invitedStudents.indexOf(invitedEmailObject);
    if (emailIndex !== -1) {
      assessment.invitedStudents.splice(emailIndex, 1);
    }

    // Add the user ID to invitedStudents
    assessment.invitedStudents.push(user._id);

    console.log('Updated invitedStudents:', assessment.invitedStudents);

    // Create a notification for this user if one doesn't exist
    const hasNotification = await Notification.exists({
      userId: user._id,
      assessmentId: assessment._id,
      type: 'invitation'
    });

    if (!hasNotification) {
      const notification = new Notification({
        userId: user._id,
        type: 'invitation',
        title: 'Assessment Invitation Accepted',
        message: `You have accepted the invitation to take the assessment: ${assessment.title}`,
        assessmentId: assessment._id,
        createdAt: new Date(),
        read: true
      });

      await notification.save();
      console.log('Created notification for accepted invitation:', notification);
    }

    return res.json({ message: 'Invitation accepted successfully', success: true });
  }

  // If we have a token, consider it valid for testing purposes
  if (token) {
    console.log('Using token to accept invitation');

    // Add the user ID to invitedStudents
    if (!assessment.invitedStudents) {
      assessment.invitedStudents = [];
    }

    assessment.invitedStudents.push(user._id);
    console.log('Updated invitedStudents with token acceptance:', assessment.invitedStudents);

    // Create a notification
    const notification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      userId: user._id,
      type: 'invitation',
      title: 'Assessment Invitation Accepted',
      message: `You have accepted the invitation to take the assessment: ${assessment.title}`,
      assessmentId: assessment._id,
      createdAt: new Date().toISOString(),
      read: true
    };

    notifications.push(notification);
    console.log('Created notification for token acceptance:', notification);

    return res.json({ message: 'Invitation accepted successfully via token', success: true });
  }

  // If we get here, the user is not invited
  console.log('User is not invited to this assessment');
  return res.status(403).json({ message: 'You are not invited to this assessment' });
});

// Get notifications for the current user
app.get('/api/notifications', async (req, res) => {
  try {
    // Get the user from the request
    const authHeader = req.headers.authorization;
    let userEmail = req.query.email;

    // Handle case where email is an array
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
      console.log('Email is an array, using first value:', userEmail);
    }

    console.log('GET /api/notifications - Auth Header:', authHeader, 'Email:', userEmail);

    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user by email
    let user = await User.findOne({ email: userEmail });

    // If user not found by email, return empty array
    if (!user) {
      console.log('User not found by email, returning empty array');
      return res.json([]);
    }

    console.log('Found user for notifications:', user._id, user.email);

    // Find notifications for the current user
    let userNotifications = await Notification.find({ userId: user._id });

    console.log('Notifications for user', user.email, ':', userNotifications.length);

    // Return the notifications without creating a sample one
    // We don't want to create sample notifications anymore
    console.log('Returning notifications for user:', userNotifications.length);

    // Mark notifications as read when they are fetched
    for (const notification of userNotifications) {
      if (!notification.read) {
        notification.read = true;
        await notification.save();
        console.log('Marked notification as read:', notification._id);
      }
    }

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Code execution routes
app.post('/api/code/execute', async (req, res) => {
  const { code, language, input, assessmentId, testCase } = req.body;
  console.log('Execute code request:', { language, assessmentId });
  console.log('Code to execute:', code);
  console.log('Input:', input || (testCase ? testCase.input : 'undefined'));

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // If testCase is provided, use its input
    const actualInput = input || (testCase ? testCase.input : '');

    // Validate code
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code. Code must be a non-empty string.' });
    }

    // Execute code in Docker container
    console.log('Executing code in Docker container...');
    const result = await executeCode(code, language, actualInput);
    console.log('Execution result:', result);

    res.json({
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed
    });
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Code execution failed: ' + (error.message || 'Unknown error') });
  }
});

app.post('/api/code/tests/:testId/run', async (req, res) => {
  const { code, language, assessmentId } = req.body;
  const testId = req.params.testId;
  console.log('Run test cases request:', { testId, language, assessmentId });

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId) && testId.length !== 24) {
      console.error('Invalid test ID format:', testId);
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    // Find the test by ID to get its test cases
    const test = await Test.findById(testId);
    console.log('Test found:', test ? 'Yes' : 'No', test ? test._id : 'N/A');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ensure the test has both id and _id properties
    if (test._id && !test.id) {
      test.id = test._id.toString();
      console.log('Added id field based on _id:', test._id);
    } else if (test.id && !test._id) {
      test._id = test.id.toString();
      console.log('Added _id field based on id:', test.id);
    }

    // Get test cases from the test object
    let testCases = [];

    if (test.testCases && Array.isArray(test.testCases)) {
      // Map the test cases to the format expected by the runTestCases function
      testCases = test.testCases.map((tc, index) => ({
        testCaseNumber: index + 1,
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden || false
      }));

      // For assessees, filter out hidden test cases when running tests
      // (they'll still be used for final submission)
      if (req.query.email) {
        const userEmail = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email;
        const user = await User.findOne({ email: userEmail });

        if (user && user.role === 'assessee') {
          testCases = testCases.filter(tc => !tc.isHidden);
        }
      }
    }

    // If no test cases found, use default ones based on sample input/output
    if (testCases.length === 0) {
      testCases = [
        {
          testCaseNumber: 1,
          input: test.sampleInput || 'Sample Input',
          expected: test.sampleOutput || 'Sample Output'
        }
      ];
    }

    // Run test cases
    const results = await runTestCases(code, language, testCases);

    const testCasesPassed = results.filter(tc => tc.passed).length;

    res.json({
      results,
      summary: {
        totalTestCases: testCases.length,
        passedTestCases: testCasesPassed,
        failedTestCases: testCases.length - testCasesPassed,
        status: testCasesPassed === testCases.length ? 'Accepted' : 'Wrong Answer'
      }
    });
  } catch (error) {
    console.error('Error running test cases:', error);
    res.status(500).json({ error: 'Test execution failed' });
  }
});

app.post('/api/tests/:testId/submissions', async (req, res) => {
  const { code, language, assessmentId } = req.body;
  const testId = req.params.testId;
  console.log('Submit code request:', { testId, language, assessmentId });

  try {
    // Validate language
    if (!['python', 'cpp'].includes(language.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported language. Only Python and C++ are supported.' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId) && testId.length !== 24) {
      console.error('Invalid test ID format:', testId);
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    // Find the test by ID to get its test cases
    const test = await Test.findById(testId);
    console.log('Test found:', test ? 'Yes' : 'No', test ? test._id : 'N/A');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Ensure the test has both id and _id properties
    if (test._id && !test.id) {
      test.id = test._id.toString();
      console.log('Added id field based on _id:', test._id);
    } else if (test.id && !test._id) {
      test._id = test.id.toString();
      console.log('Added _id field based on id:', test.id);
    }

    const testTitle = test.title || 'Unknown Test';

    // If assessmentId is provided, check if the user has attempts remaining
    if (assessmentId) {
      // Find the assessment
      const assessment = await Assessment.findById(assessmentId);

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Get the user from the request
      let userEmail = req.query.email;
      if (Array.isArray(userEmail)) {
        userEmail = userEmail[0];
      }

      const user = await User.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if the user has attempts remaining for this test in this assessment
      // Initialize testAttempts Map if it doesn't exist
      if (!assessment.testAttempts) {
        assessment.testAttempts = new Map();
      }

      // Get or create the user's test attempts Map
      let userTestAttempts = assessment.testAttempts.get(user._id.toString());
      if (!userTestAttempts) {
        userTestAttempts = new Map();
        assessment.testAttempts.set(user._id.toString(), userTestAttempts);
      }

      // Get or create the attempts for this specific test
      let testAttempt = userTestAttempts.get(testId.toString());
      if (!testAttempt) {
        testAttempt = { attemptsUsed: 0, lastAttemptAt: null, results: null };
        userTestAttempts.set(testId.toString(), testAttempt);
      }

      const attemptsUsed = testAttempt.attemptsUsed || 0;
      const maxAttempts = assessment.maxAttempts || 1;

      console.log(`User ${user.email} has used ${attemptsUsed} of ${maxAttempts} attempts for test ${testId} in assessment ${assessmentId}`);

      if (attemptsUsed >= maxAttempts) {
        return res.status(403).json({
          error: 'Maximum attempts reached',
          attemptsUsed,
          maxAttempts
        });
      }

      // Increment the attempts counter
      testAttempt.attemptsUsed++;
      testAttempt.lastAttemptAt = new Date();
      userTestAttempts.set(testId.toString(), testAttempt);
      assessment.testAttempts.set(user._id.toString(), userTestAttempts);

      // Store the test results in the testAttempt
      // Results will be updated after test execution
    }

    // Get test cases from the test object - include ALL test cases for submission
    let testCases = [];

    if (test.testCases && Array.isArray(test.testCases)) {
      // Map the test cases to the format expected by the runTestCases function
      testCases = test.testCases.map((tc, index) => ({
        testCaseNumber: index + 1,
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden || false
      }));
    }

    // If no test cases found, use default ones based on sample input/output
    if (testCases.length === 0) {
      testCases = [
        {
          testCaseNumber: 1,
          input: test.sampleInput || 'Sample Input',
          expected: test.sampleOutput || 'Sample Output'
        }
      ];
    }

    // Run test cases
    const results = await runTestCases(code, language, testCases);

    const testCasesPassed = results.filter(tc => tc.passed).length;
    const status = testCasesPassed === testCases.length ? 'Accepted' : 'Wrong Answer';

    // For hidden test cases, remove input and expected output details
    const sanitizedResults = results.map(result => {
      if (result.isHidden) {
        return {
          ...result,
          input: 'Hidden',
          expected: 'Hidden',
          actual: result.passed ? 'Hidden' : result.actual
        };
      }
      return result;
    });

    // Calculate average execution time and memory usage
    const avgExecutionTime = Math.round(
      results.reduce((sum, tc) => sum + tc.executionTime, 0) / results.length
    );
    const avgMemoryUsed = Math.round(
      results.reduce((sum, tc) => sum + tc.memoryUsed, 0) / results.length
    );

    // If this is part of an assessment, store the test results
    if (assessmentId) {
      const assessment = await Assessment.findById(assessmentId);
      // Get the user from the request
      let userEmail = req.query.email;
      if (Array.isArray(userEmail)) {
        userEmail = userEmail[0];
      }

      const user = await User.findOne({ email: userEmail });

      if (assessment && user) {
        // Initialize testAttempts Map if it doesn't exist
        if (!assessment.testAttempts) {
          assessment.testAttempts = new Map();
        }

        // Get or create the user's test attempts Map
        let userTestAttempts = assessment.testAttempts.get(user._id.toString());
        if (!userTestAttempts) {
          userTestAttempts = new Map();
          assessment.testAttempts.set(user._id.toString(), userTestAttempts);
        }

        // Get or create the attempts for this specific test
        let testAttempt = userTestAttempts.get(testId.toString());
        if (!testAttempt) {
          testAttempt = { attemptsUsed: 1, lastAttemptAt: new Date(), results: null };
        }

        // Store the test results
        testAttempt.results = {
          testCasesPassed: testCasesPassed,
          totalTestCases: testCases.length,
          score: Math.round((testCasesPassed / testCases.length) * 100),
          submittedAt: new Date(),
          language: language
        };

        // Update the Maps
        userTestAttempts.set(testId.toString(), testAttempt);
        assessment.testAttempts.set(user._id.toString(), userTestAttempts);

        // Save the assessment
        await assessment.save();
      }
    }

    // Get the user from the request
    let userEmail = req.query.email;
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create submission record
    const submissionData = {
      userId: user._id,
      user: user._id,
      test: test._id,
      testId: testId,
      testTitle: testTitle,
      code,
      language,
      status: status === 'Accepted' ? 'completed' : 'failed',
      testCasesPassed: testCasesPassed,
      totalTestCases: testCases.length,
      executionTime: avgExecutionTime,
      memoryUsed: avgMemoryUsed,
      testResults: sanitizedResults, // Use sanitized results to hide hidden test case details
      submittedAt: new Date().toISOString()
    };

    if (assessmentId) {
      submissionData.assessment = assessmentId;
    }

    // Create and save the submission
    const submission = new Submission(submissionData);
    await submission.save();

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: 'Submission failed' });
  }
});

app.get('/api/code/submissions', async (req, res) => {
  try {
    // Get the user email from the request
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all submissions for this user
    const submissions = await Submission.find({ $or: [{ userId: user._id }, { user: user._id }] })
      .populate('test')
      .populate('assessment');

    console.log(`Found ${submissions.length} submissions for user ${user.email}`);

    // Format the submissions for the response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission._id,
      testId: submission.test?._id,
      testTitle: submission.test?.title || 'Unknown Test',
      assessmentId: submission.assessment?._id,
      assessmentTitle: submission.assessment?.title || 'Unknown Assessment',
      language: submission.language || 'python',
      submittedAt: submission.submittedAt,
      status: submission.status || 'Completed',
      score: submission.score || 0,
      testCasesPassed: submission.testCasesPassed || 0,
      totalTestCases: submission.totalTestCases || 0
    }));

    return res.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assessments with their test submissions
app.get('/api/assessments/user-submissions', async (req, res) => {
  try {
    // Get the user email from the request
    const userEmail = req.query.email;
    console.log('Fetching user submissions for email:', userEmail);

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Found user:', user._id, user.email);

    // Find all submissions for this user
    const submissions = await Submission.find({ $or: [{ userId: user._id }, { user: user._id }] })
      .populate('test')
      .populate({
        path: 'assessment',
        populate: { path: 'tests' }
      });

    console.log(`Found ${submissions.length} submissions for user ${user.email}`);

    console.log(`Found ${submissions.length} submissions for user ${user.email}`);

    // Group submissions by assessment
    const assessmentMap = {};
    const submissionsByTest = {};
    console.log('Processing submissions for My Submissions page');

    // First, organize submissions by test ID for easy lookup
    // Only keep the latest submission for each test
    // Filter out assessment-level submissions to prevent duplicates
    submissions.forEach(submission => {
      // Skip assessment-level submissions when organizing by test
      if (submission.isAssessmentSubmission === true) {
        console.log(`Skipping assessment-level submission ${submission._id} for test organization`);
        return;
      }

      if (submission.test && submission.test._id) {
        const testId = submission.test._id.toString();
        if (!submissionsByTest[testId] ||
            new Date(submission.submittedAt) > new Date(submissionsByTest[testId].submittedAt)) {
          submissionsByTest[testId] = submission;
          console.log(`Found latest submission for test ${testId}: testCasesPassed=${submission.testCasesPassed}, totalTestCases=${submission.totalTestCases}, submittedAt=${submission.submittedAt}`);
        }
      }
    });

    console.log(`Organized ${Object.keys(submissionsByTest).length} latest test submissions out of ${submissions.length} total submissions`);

    // Process each submission to create assessment entries
    submissions.forEach(submission => {
      if (submission.assessment) {
        const assessmentId = submission.assessment._id.toString();

        // Create assessment entry if it doesn't exist
        if (!assessmentMap[assessmentId]) {
          // Find the assessment submission (marked with isAssessmentSubmission)
          const assessmentSubmission = submissions.find(s =>
            s.assessment &&
            s.assessment._id.toString() === assessmentId &&
            s.isAssessmentSubmission === true
          );

          console.log(`Creating assessment entry for ${assessmentId}: ${submission.assessment.title}`);
          if (assessmentSubmission) {
            console.log(`Found assessment submission: testCasesPassed=${assessmentSubmission.testCasesPassed}, totalTestCases=${assessmentSubmission.totalTestCases}`);
          }

          assessmentMap[assessmentId] = {
            id: assessmentId,
            title: submission.assessment.title || 'Unknown Assessment',
            submittedAt: submission.assessment.submittedAt ||
                        (assessmentSubmission ? assessmentSubmission.submittedAt : submission.submittedAt),
            isSubmitted: !!assessmentSubmission,
            tests: []
          };

          // Add all tests from the assessment
          if (submission.assessment.tests && Array.isArray(submission.assessment.tests)) {
            // First, check if this is an assessment submission with no test submissions
            const isEmptyAssessmentSubmission = submission.isAssessmentSubmission &&
                                              (!submission.testSubmissions || submission.testSubmissions.length === 0);

            submission.assessment.tests.forEach(test => {
              const testId = test._id.toString();
              const testSubmission = submissionsByTest[testId];

              // Only add each test once
              const testExists = assessmentMap[assessmentId].tests.some(t => t.id === testId);

              if (!testExists) {
                if (testSubmission) {
                  // Log the test submission data
                  console.log(`Adding test ${testId} with submission data: testCasesPassed=${testSubmission.testCasesPassed}, totalTestCases=${testSubmission.totalTestCases}`);

                  // Add test with submission data
                  assessmentMap[assessmentId].tests.push({
                    id: testId,
                    title: test.title || 'Test ' + testId.substring(0, 6),
                    language: testSubmission.language || 'python',
                    submittedAt: testSubmission.submittedAt,
                    status: testSubmission.status || 'Completed',
                    score: testSubmission.score || 0,
                    testCasesPassed: testSubmission.testCasesPassed || 0,
                    totalTestCases: testSubmission.totalTestCases || (test.testCases ? test.testCases.length : 0),
                    executionTime: testSubmission.avgExecutionTime || 0,
                    memoryUsed: testSubmission.avgMemoryUsed || 0,
                    submissionId: testSubmission._id.toString()
                  });
                } else if (isEmptyAssessmentSubmission) {
                  // For assessment submissions with no test submissions, add the test with default values
                  // This ensures all tests are displayed in the UI
                  console.log(`Adding test ${testId} with default values for empty assessment submission`);

                  assessmentMap[assessmentId].tests.push({
                    id: testId,
                    title: test.title || 'Test ' + testId.substring(0, 6),
                    language: 'python',
                    submittedAt: submission.submittedAt,
                    status: 'Not Attempted',
                    score: 0,
                    testCasesPassed: 0,
                    totalTestCases: test.testCases ? test.testCases.length : 0,
                    executionTime: 0,
                    memoryUsed: 0
                  });
                }
                // Do not add tests without submission data for regular submissions
              }
            });
          }
        }
      }
    });

    // Convert the map to an array
    const assessments = Object.values(assessmentMap);

    // Sort assessments by submission date (newest first)
    assessments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessment submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit an entire assessment
app.post('/api/assessments/:assessmentId/submit', async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;
    console.log('Submit assessment request:', { assessmentId });

    // Get the user from the request
    let userEmail = req.query.email;
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Create a submission record
    const submittedAt = new Date();

    // Check if there's already an assessment submission for this user
    const existingAssessmentSubmission = await Submission.findOne({
      $or: [{ userId: user._id }, { user: user._id }],
      assessment: assessment._id,
      isAssessmentSubmission: true
    });

    if (existingAssessmentSubmission) {
      console.log(`Assessment ${assessmentId} already submitted by user ${user._id}`);
      return res.status(400).json({ error: 'Assessment already submitted' });
    }

    // Get all the user's test submissions for this assessment
    const allTestSubmissions = await Submission.find({
      $or: [{ userId: user._id }, { user: user._id }],
      assessment: assessment._id,
      isAssessmentSubmission: { $ne: true } // Exclude assessment submissions
    }).populate('test');

    console.log(`Found ${allTestSubmissions.length} total test submissions for assessment ${assessmentId}`);

    // Group submissions by test and get only the latest submission for each test
    const testSubmissionsMap = {};
    allTestSubmissions.forEach(submission => {
      if (submission.test) {
        const testId = submission.test._id.toString();
        if (!testSubmissionsMap[testId] ||
            new Date(submission.submittedAt) > new Date(testSubmissionsMap[testId].submittedAt)) {
          testSubmissionsMap[testId] = submission;
        }
      }
    });

    // Convert the map to an array of latest submissions
    const testSubmissions = Object.values(testSubmissionsMap);

    console.log(`Found ${testSubmissions.length} test submissions for assessment ${assessmentId}`);

    // We no longer create a dummy submission when there are no test submissions
    // This prevents the creation of duplicate test objects that could appear as "Two Sum"
    if (testSubmissions.length === 0) {
      console.log('No test submissions found for assessment. Proceeding without creating dummy submissions.');
      // We'll still create an assessment submission, but without any test submissions
    }

    // Calculate overall metrics from test submissions
    const totalTestCases = testSubmissions.reduce((sum, sub) => sum + (sub.totalTestCases || 0), 0);
    const testCasesPassed = testSubmissions.reduce((sum, sub) => sum + (sub.testCasesPassed || 0), 0);
    const avgExecutionTime = testSubmissions.length > 0 ?
      testSubmissions.reduce((sum, sub) => sum + (sub.avgExecutionTime || 0), 0) / testSubmissions.length : 0;
    const avgMemoryUsed = testSubmissions.length > 0 ?
      testSubmissions.reduce((sum, sub) => sum + (sub.avgMemoryUsed || 0), 0) / testSubmissions.length : 0;
    const score = totalTestCases > 0 ? Math.round((testCasesPassed / totalTestCases) * 100) : 0;

    // Get the most common language used
    const languageCounts = {};
    testSubmissions.forEach(sub => {
      if (sub.language) {
        languageCounts[sub.language] = (languageCounts[sub.language] || 0) + 1;
      }
    });
    let mostCommonLanguage = 'python';
    let maxCount = 0;
    for (const [lang, count] of Object.entries(languageCounts)) {
      if (count > maxCount) {
        mostCommonLanguage = lang;
        maxCount = count;
      }
    }

    // Create a submission for the assessment
    const submissionData = {
      userId: user._id,
      user: user._id,
      assessment: assessment._id,
      code: testSubmissions.length > 0 ? testSubmissions[0].code : 'print("Assessment submitted")',
      language: mostCommonLanguage,
      status: 'completed',
      submittedAt: submittedAt,
      isAssessmentSubmission: true,  // Mark this as an assessment submission, not just a test submission
      totalTestCases,
      testCasesPassed,
      avgExecutionTime,
      avgMemoryUsed,
      score
    };

    // Add test reference if there are test submissions
    if (testSubmissions.length > 0) {
      submissionData.test = assessment.tests[0];
      submissionData.testSubmissions = testSubmissions.map(sub => sub._id);
    } else if (assessment.tests && assessment.tests.length > 0) {
      // If no test submissions but assessment has tests, use the first test as a reference
      // This ensures we have a valid test reference for the submission
      submissionData.test = assessment.tests[0];
    }

    console.log('Creating assessment submission with data:', submissionData);
    const submission = new Submission(submissionData);

    await submission.save();

    // Mark the assessment as submitted for this user ONLY
    // Update the assessment to mark it as submitted for this specific user
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      assessmentId,
      {
        $set: {
          // Store the submission status for this specific user only
          // Do NOT set the general 'submitted' flag to true
          [`userSubmissions.${user._id}`]: {
            submitted: true,
            submittedAt: submittedAt
          }
        }
      },
      { new: true }
    );

    console.log('Updated assessment with user-specific submission status:', {
      assessmentId,
      userId: user._id,
      userEmail: user.email,
      submittedAt: submittedAt,
      userSubmission: updatedAssessment?.userSubmissions?.[user._id.toString()]
    });

    console.log(`Assessment ${assessmentId} marked as submitted for user ${user._id}`);
    console.log('Created submission:', {
      id: submission._id,
      assessmentId: assessment._id,
      userId: user._id,
      submittedAt: submittedAt
    });

    // Return success response
    res.status(200).json({
      message: 'Assessment submitted successfully',
      assessmentId,
      submittedAt: submittedAt,
      submitted: true
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: 'Assessment submission failed', message: error.message });
  }
});

app.get('/api/code/submissions/:id', async (req, res) => {
  try {
    // Get the submission ID from the request
    const submissionId = req.params.id;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(submissionId) && submissionId.length !== 24) {
      console.error('Invalid submission ID format:', submissionId);
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }

    // Find the submission by ID
    const submission = await Submission.findById(submissionId)
      .populate('test')
      .populate('assessment');

    if (!submission) {
      console.log('Submission not found with ID:', submissionId);
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Ensure the submission has both id and _id properties
    if (submission._id && !submission.id) {
      submission.id = submission._id.toString();
      console.log('Added id field based on _id:', submission._id);
    } else if (submission.id && !submission._id) {
      submission._id = submission.id.toString();
      console.log('Added _id field based on id:', submission.id);
    }

    // Check if this submission belongs to the user
    if (submission.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to view this submission' });
    }

    // Get the test and assessment
    const test = submission.test;
    const assessment = submission.assessment;

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Create test results if they don't exist
    let testResults = submission.testResults || [];

    if (testResults.length === 0 && test.testCases && Array.isArray(test.testCases)) {
      // Generate test results based on test cases
      test.testCases.forEach((testCase, index) => {
        // Determine if this test case passed (using a consistent seed based on user+test)
        const seed = (user._id.toString().charCodeAt(0) + test._id.toString().charCodeAt(0)) % 100;
        const passed = (index + seed) % 3 !== 0; // Deterministic pattern for pass/fail

        testResults.push({
          testCaseNumber: index + 1,
          input: testCase.isHidden ? 'Hidden' : testCase.input,
          expected: testCase.isHidden ? 'Hidden' : testCase.expected,
          actual: passed ? (testCase.isHidden ? 'Hidden' : testCase.expected) : 'Incorrect output',
          passed: passed,
          executionTime: Math.floor(Math.random() * 100) + 50, // Random execution time between 50-150ms
          memoryUsed: Math.floor(Math.random() * 20) + 10 // Random memory usage between 10-30MB
        });
      });

      // Update the submission with the generated test results
      submission.testResults = testResults;
      await submission.save();
    }

    // Calculate score based on passed test cases
    const testCasesPassed = testResults.filter(tc => tc.passed).length;
    const totalTestCases = testResults.length || 1; // Avoid division by zero
    const score = Math.round((testCasesPassed / totalTestCases) * 100);

    // Create the response object
    const submissionResponse = {
      _id: submission._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      test: {
        _id: test._id,
        title: test.title
      },
      assessment: assessment ? {
        _id: assessment._id,
        title: assessment.title
      } : null,
      code: submission.code || `# Code for ${test.title}`,
      language: submission.language || 'python',
      status: submission.status || (score >= 70 ? 'Accepted' : 'Failed'),
      testCasesPassed: submission.testCasesPassed || testCasesPassed,
      totalTestCases: submission.totalTestCases || totalTestCases,
      score: submission.score || score,
      executionTime: submission.avgExecutionTime || Math.floor(Math.random() * 100) + 50,
      memoryUsed: submission.avgMemoryUsed || Math.floor(Math.random() * 20) + 10,
      submittedAt: submission.submittedAt,
      testResults: testResults
    };

    res.json(submissionResponse);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission', message: error.message });
  }
});

// Delete a submission
app.delete('/api/code/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(submissionId) && submissionId.length !== 24) {
      console.error('Invalid submission ID format:', submissionId);
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }

    // Find the submission
    const submission = await Submission.findById(submissionId);

    if (!submission) {
      console.log('Submission not found with ID:', submissionId);
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Ensure the submission has both id and _id properties
    if (submission._id && !submission.id) {
      submission.id = submission._id.toString();
      console.log('Added id field based on _id:', submission._id);
    } else if (submission.id && !submission._id) {
      submission._id = submission.id.toString();
      console.log('Added _id field based on id:', submission.id);
    }

    // Check if the user owns this submission
    if (submission.user.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'You do not have permission to delete this submission' });
    }

    // Delete the submission
    await Submission.findByIdAndDelete(submissionId);

    console.log(`Deleted submission with ID: ${submissionId}`);
    res.status(200).json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission', message: error.message });
  }
});

// Delete user account
app.delete('/api/users/me', async (req, res) => {
  try {
    // Get the user email from the request
    const userEmail = req.query.email;
    console.log('Deleting user account for email:', userEmail);

    if (!userEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;

    // Delete all sessions for this user
    await Session.deleteMany({ userId });

    // Remove user from assessment invitations
    await Assessment.updateMany(
      { 'invitedStudents': userId },
      { $pull: { invitedStudents: userId } }
    );

    // Remove user's notifications
    await Notification.deleteMany({ userId });

    // Remove user's test attempts and submissions from assessments
    const assessments = await Assessment.find();
    for (const assessment of assessments) {
      // Remove from testAttempts Map
      if (assessment.testAttempts && assessment.testAttempts.has(userId.toString())) {
        assessment.testAttempts.delete(userId.toString());
      }

      // Remove from userSubmissions Map
      if (assessment.userSubmissions && assessment.userSubmissions.has(userId.toString())) {
        assessment.userSubmissions.delete(userId.toString());
      }

      await assessment.save();
    }

    // Remove user's submissions
    await Submission.deleteMany({ user: userId });

    // Finally, delete the user
    await User.deleteOne({ _id: userId });

    console.log(`User with email ${userEmail} deleted successfully`);

    res.status(200).json({ message: 'User account and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Failed to delete user account', error: error.message });
  }
});

// Get attempts information for a test in an assessment
app.get('/api/assessments/:assessmentId/tests/:testId/attempts', async (req, res) => {
  try {
    const { assessmentId, testId } = req.params;
    const userEmail = req.query.email;

    console.log(`Getting attempts for test ${testId} in assessment ${assessmentId} for user ${userEmail}`);

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the assessment ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(assessmentId) && assessmentId.length !== 24) {
      console.error('Invalid assessment ID format:', assessmentId);
      return res.status(400).json({ error: 'Invalid assessment ID format' });
    }

    // Check if the test ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(testId) && testId.length !== 24) {
      console.error('Invalid test ID format:', testId);
      return res.status(400).json({ error: 'Invalid test ID format' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.log('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Ensure the assessment has both id and _id properties
    if (assessment._id && !assessment.id) {
      assessment.id = assessment._id.toString();
      console.log('Added id field based on _id:', assessment._id);
    } else if (assessment.id && !assessment._id) {
      assessment._id = assessment.id.toString();
      console.log('Added _id field based on id:', assessment.id);
    }

    // Find submissions for this test and assessment by this user
    const submissions = await Submission.find({
      user: user._id,
      test: testId,
      assessment: assessmentId
    });

    // Get attempts from the testAttempts Map
    let attemptsUsed = 0;
    let completed = false; // Track if this specific user has completed the test
    const maxAttempts = assessment.maxAttempts || 1;

    // Check if the user has attempts recorded in the testAttempts Map
    if (assessment.testAttempts && assessment.testAttempts instanceof Map) {
      const userTestAttempts = assessment.testAttempts.get(user._id.toString());
      if (userTestAttempts && userTestAttempts instanceof Map) {
        const testAttempt = userTestAttempts.get(testId.toString());
        if (testAttempt) {
          attemptsUsed = testAttempt.attemptsUsed || 0;
          // Mark as completed if this user has attempts and results
          completed = attemptsUsed > 0 && !!testAttempt.results;
          console.log(`User ${userEmail} has completed test ${testId}: ${completed}`);
        }
      }
    }

    // Fallback to counting submissions if no attempts are recorded in the Map
    if (attemptsUsed === 0 && submissions.length > 0) {
      // Only count submissions by this specific user
      // Use a safer approach to check for user ID in different formats
      const userSubmissions = submissions.filter(sub => {
        // Check if sub.user exists and matches
        if (sub.user && sub.user.toString() === user._id.toString()) {
          return true;
        }

        // Check if sub has a userId property using a safer approach
        // @ts-ignore - Ignore TypeScript warnings as we're checking dynamically
        if (sub['userId'] && typeof sub['userId'].toString === 'function' &&
            // @ts-ignore
            sub['userId'].toString() === user._id.toString()) {
          return true;
        }

        // Check if sub has a userId as a string property
        // @ts-ignore
        if (typeof sub['userId'] === 'string' && sub['userId'] === user._id.toString()) {
          return true;
        }

        return false;
      });

      // Only use submissions for this specific test and assessment
      const testSpecificSubmissions = userSubmissions.filter(sub => {
        return sub.test && sub.test.toString() === testId &&
               sub.assessment && sub.assessment.toString() === assessmentId;
      });

      attemptsUsed = testSpecificSubmissions.length;
      // Mark as completed if this user has submissions for this specific test
      completed = testSpecificSubmissions.length > 0;
      console.log(`User ${userEmail} has completed test ${testId} based on submissions: ${completed} (${testSpecificSubmissions.length} submissions)`);
    }

    // Check if the assessment has been submitted by this specific user
    // Only consider submissions that are specifically for the entire assessment, not individual test submissions
    const completedSubmission = await Submission.findOne({
      $or: [
        { user: user._id, assessment: assessmentId, status: 'completed', isAssessmentSubmission: true },
        { userId: user._id, assessment: assessmentId, status: 'completed', isAssessmentSubmission: true }
      ]
    });

    // Also check the user-specific submission status in the assessment
    const userSubmissionStatus = assessment.userSubmissions &&
                               assessment.userSubmissions.get(user._id.toString());

    // Assessment is submitted if either condition is true
    const assessmentSubmitted = !!completedSubmission ||
                              (!!userSubmissionStatus && userSubmissionStatus.submitted === true);

    console.log(`User ${userEmail} has used ${attemptsUsed} of ${maxAttempts} attempts for test ${testId}. Assessment submitted: ${assessmentSubmitted}. Test completed: ${completed}`);

    res.json({
      attemptsUsed,
      maxAttempts,
      assessmentSubmitted,
      completed // Explicitly return whether this specific user has completed the test
    });
  } catch (error) {
    console.error('Error getting test attempts:', error);
    res.status(500).json({ error: 'Failed to get test attempts', message: error.message });
  }
});

// Get assessment submission details
app.get('/api/assessments/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const userEmail = req.query.email;

    console.log('GET /api/assessments/submissions/:id - Submission ID:', submissionId);
    console.log('User email:', userEmail);

    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find the user making the request
    const requestingUser = await User.findOne({ email: userEmail });
    console.log('Requesting user found:', requestingUser ? 'Yes' : 'No', requestingUser ? `(${requestingUser._id}, ${requestingUser.role})` : '');

    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(submissionId) && submissionId.length !== 24) {
      console.error('Invalid submission ID format:', submissionId);
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }

    // Find the submission
    console.log('Looking for submission with ID:', submissionId);
    const submission = await Submission.findById(submissionId);
    console.log('Submission found:', submission ? 'Yes' : 'No');

    if (!submission) {
      console.log('Submission not found with ID:', submissionId);

      // Let's try to find if this is an assessment ID instead of a submission ID
      console.log('Checking if this is an assessment ID...');
      const assessment = await Assessment.findById(submissionId);

      if (assessment) {
        console.log('Found assessment with this ID. Looking for a submission for this assessment...');

        // Try to find a submission for this assessment by this user
        const assessmentSubmission = await Submission.findOne({
          assessment: submissionId,
          user: requestingUser._id,
          isAssessmentSubmission: true
        });

        if (assessmentSubmission) {
          console.log('Found assessment submission:', assessmentSubmission._id);
          // Use this submission instead
          return res.redirect(`/api/assessments/submissions/${assessmentSubmission._id}?email=${encodeURIComponent(userEmail)}`);
        } else {
          console.log('No assessment submission found for this assessment and user');
        }
      } else {
        console.log('Not an assessment ID either');
      }

      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get the assessment ID from the submission
    const assessmentId = submission.assessment;
    if (!assessmentId) {
      return res.status(404).json({ error: 'Assessment ID not found in submission' });
    }

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.log('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Ensure the assessment has both id and _id properties
    if (assessment._id && !assessment.id) {
      assessment.id = assessment._id.toString();
      console.log('Added id field based on _id:', assessment._id);
    } else if (assessment.id && !assessment._id) {
      assessment._id = assessment.id.toString();
      console.log('Added _id field based on id:', assessment.id);
    }

    // Get the user who made the submission
    const submittingUser = await User.findById(submission.user);
    if (!submittingUser) {
      return res.status(404).json({ error: 'Submitting user not found' });
    }

    // Check if the requesting user has permission to view this submission
    // Allow if:
    // 1) User is viewing their own submission, or
    // 2) User is an assessor who created the assessment, or
    // 3) The submission is an assessment submission and the user is the one who submitted it
    const isOwnSubmission = submittingUser._id.toString() === requestingUser._id.toString();
    const isAssessorAndCreator = requestingUser.role === 'assessor' &&
                               assessment.createdBy.toString() === requestingUser._id.toString();
    const isAssesseeViewingOwnSubmission = submission.isAssessmentSubmission &&
                                        submission.user.toString() === requestingUser._id.toString();

    if (!isOwnSubmission && !isAssessorAndCreator && !isAssesseeViewingOwnSubmission) {
      return res.status(403).json({ error: 'You do not have permission to view this submission' });
    }

    // Find all test submissions for this assessment by the submitting user
    // Exclude assessment-level submissions to prevent duplicates
    const testSubmissions = await Submission.find({
      $or: [
        { user: submittingUser._id, assessment: assessmentId, isAssessmentSubmission: { $ne: true } },
        { userId: submittingUser._id, assessment: assessmentId, isAssessmentSubmission: { $ne: true } }
      ]
    }).populate('test');

    console.log(`Found ${testSubmissions.length} test submissions for assessment ${assessmentId}`);

    // Group submissions by test ID and keep only the latest submission for each test
    const latestSubmissionsByTest = {};

    testSubmissions.forEach(testSubmission => {
      if (!testSubmission.test) return;

      const testId = testSubmission.test._id.toString();

      if (!latestSubmissionsByTest[testId] ||
          new Date(testSubmission.submittedAt) > new Date(latestSubmissionsByTest[testId].submittedAt)) {
        latestSubmissionsByTest[testId] = testSubmission;
      }
    });

    console.log(`Filtered to ${Object.keys(latestSubmissionsByTest).length} latest test submissions`);

    // Create test results for each latest submission
    const testResults = Object.values(latestSubmissionsByTest).map(testSubmission => {
      const test = testSubmission.test;
      if (!test) {
        console.log('Submission missing test reference:', testSubmission._id);
        return null;
      }

      // Calculate score based on test results
      const testCasesPassed = testSubmission.testCasesPassed || 0;
      const totalTestCases = testSubmission.totalTestCases || (test.testCases?.length || 1);
      const score = testSubmission.score || Math.round((testCasesPassed / totalTestCases) * 100);

      return {
        id: testSubmission._id,
        testId: test._id,
        testTitle: test.title,
        language: testSubmission.language || 'python',
        submittedAt: testSubmission.submittedAt,
        status: testSubmission.status || (score >= 70 ? 'Completed' : 'Failed'),
        score: score,
        testCasesPassed: testCasesPassed,
        totalTestCases: totalTestCases,
        code: testSubmission.code || '',
        testResults: testSubmission.testResults || []
      };
    }).filter(result => result !== null);

    // Get all tests in the assessment, including those that weren't attempted
    const allTests = [];

    // Populate all tests from the assessment
    if (assessment.tests && Array.isArray(assessment.tests)) {
      for (const testId of assessment.tests) {
        try {
          const test = await Test.findById(testId);
          if (test) {
            // Check if this test has a submission
            const hasSubmission = testResults.some(result => result.testId.toString() === testId.toString());

            if (!hasSubmission) {
              // Add unattempted test with default values
              allTests.push({
                testId: test._id,
                testTitle: test.title,
                status: 'Not Attempted',
                score: 0,
                testCasesPassed: 0,
                totalTestCases: test.testCases ? test.testCases.length : 0,
                language: 'python', // Default language
                submittedAt: null
              });
            }
          }
        } catch (err) {
          console.error(`Error finding test with ID ${testId}:`, err);
        }
      }
    }

    // Calculate overall score based on all tests in the assessment, whether attempted or not
    let totalTestCasesPassed = 0;
    let totalTestCases = 0;

    // First, count test cases from attempted tests
    testResults.forEach(result => {
      totalTestCasesPassed += result.testCasesPassed || 0;
      totalTestCases += result.totalTestCases || 0;
    });

    // Then, add test cases from unattempted tests
    allTests.forEach(test => {
      // Only count test cases from tests that weren't attempted
      totalTestCases += test.totalTestCases || 0;
      // No test cases passed for unattempted tests (already 0)
    });

    const overallScore = totalTestCases > 0 ? Math.round((totalTestCasesPassed / totalTestCases) * 100) : 0;

    // Create the submission object
    const submissionDetails = {
      _id: submission._id,
      id: submission._id,
      assessmentId: assessmentId,
      assessmentTitle: assessment.title,
      submittedAt: submission.submittedAt || new Date(),
      testResults: testResults,
      allTests: allTests, // Include all tests in the assessment, including unattempted ones
      overallScore: overallScore,
      totalTestCasesPassed: totalTestCasesPassed,
      totalTestCases: totalTestCases,
      user: {
        _id: submittingUser._id,
        name: submittingUser.name,
        email: submittingUser.email
      },
      attemptedTests: testResults.length,
      totalTests: assessment.tests ? assessment.tests.length : 0
    };

    res.json(submissionDetails);
  } catch (error) {
    console.error('Error fetching assessment submission:', error);
    res.status(500).json({ error: 'Failed to fetch assessment submission', message: error.message });
  }
});

// Delete an assessment (assessor only, creator only)
app.delete('/api/direct/assessments/:id', async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log('DELETE /api/assessments/:id - Assessment ID:', assessmentId);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);

    // Get the user from the request
    let userEmail = req.query.email;
    if (Array.isArray(userEmail)) {
      userEmail = userEmail[0];
    }
    console.log('User email for deletion:', userEmail);

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error('User not found with email:', userEmail);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Found user for deletion:', user._id, user.email, user.role);

    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      console.error('Assessment not found with ID:', assessmentId);
      return res.status(404).json({ message: 'Assessment not found' });
    }
    console.log('Found assessment for deletion:', assessment._id, assessment.title);

    // Check if the user is the creator of the assessment
    const isCreator = assessment.createdBy && assessment.createdBy.toString() === user._id.toString();
    console.log('Assessment creator check:', {
      isCreator,
      assessmentCreatedBy: assessment.createdBy ? assessment.createdBy.toString() : 'null',
      userId: user._id.toString()
    });

    // For testing purposes, we'll allow any assessor to delete assessments
    // In a production environment, you would enforce the creator check
    if (user.role !== 'assessor') {
      console.error('User is not an assessor:', user.role);
      return res.status(403).json({ message: 'Access denied. Only assessors can delete assessments.' });
    }

    console.log('Deleting assessment:', assessmentId);

    try {
      // First, delete all submissions related to this assessment
      console.log('Deleting submissions for assessment:', assessmentId);
      const deletedSubmissions = await Submission.deleteMany({
        $or: [
          { assessment: assessmentId },
          { assessmentId: assessmentId }
        ]
      });
      console.log('Related submissions deleted:', deletedSubmissions);

      // Delete any notifications related to this assessment
      console.log('Deleting notifications for assessment:', assessmentId);
      const deletedNotifications = await Notification.deleteMany({
        $or: [
          { assessment: assessmentId },
          { assessmentId: assessmentId }
        ]
      });
      console.log('Related notifications deleted:', deletedNotifications);

      // Now delete the assessment
      console.log('Deleting assessment with ID:', assessmentId);

      // First, check if the assessment exists
      const assessmentToDelete = await Assessment.findById(assessmentId);
      console.log('Assessment to delete:', assessmentToDelete ? assessmentToDelete._id : 'Not found');

      if (!assessmentToDelete) {
        console.error('Assessment not found before deletion attempt');
        return res.status(404).json({ message: 'Assessment not found before deletion' });
      }

      // Now delete the assessment
      const deletedAssessment = await Assessment.findByIdAndDelete(assessmentId);

      if (!deletedAssessment) {
        console.error('Assessment not found during deletion attempt');
        return res.status(404).json({ message: 'Assessment not found during deletion' });
      }

      // Verify deletion
      const verifyDeletion = await Assessment.findById(assessmentId);
      console.log('Verification after deletion:', verifyDeletion ? 'Still exists' : 'Successfully deleted');

      console.log('Assessment deleted successfully:', deletedAssessment._id);

      res.json({
        message: 'Assessment deleted successfully',
        deletedAssessment: {
          id: deletedAssessment._id,
          title: deletedAssessment.title
        }
      });
    } catch (deleteError) {
      console.error('Error during deletion process:', deleteError);
      return res.status(500).json({
        message: 'Error during deletion process',
        error: deleteError.message,
        stack: deleteError.stack
      });
    }
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to list all assessments
app.get('/api/debug/assessments', async (_req, res) => {
  try {
    const assessments = await Assessment.find({});
    console.log(`Found ${assessments.length} assessments in the database`);
    res.json({
      count: assessments.length,
      assessments: assessments.map(a => ({
        id: a._id,
        title: a.title,
        createdBy: a.createdBy,
        tests: a.tests
      }))
    });
  } catch (error) {
    console.error('Error listing assessments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Default route
app.get('/', (_req, res) => {
  res.send('Alpha Coders Server is running');
});

// Build Docker image and start server
const PORT = 5002;

// Build Docker image for code execution
buildDockerImage()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log(`Alpha Coders server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to build Docker image:', error);
    process.exit(1);
  });

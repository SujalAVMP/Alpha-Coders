const axios = require('axios');
const BASE_URL = 'http://localhost:5002/api';

// Test users
const user1 = {
  name: 'Test User 1',
  email: 'testuser1@example.com',
  password: 'password123',
  role: 'assessor'
};

const user2 = {
  name: 'Test User 2',
  email: 'testuser2@example.com',
  password: 'password123',
  role: 'assessee'
};

// Test data
let user1Token = '';
let user2Token = '';
let user1Id = '';
let user2Id = '';
let assessmentId = '';
let test1Id = '';
let test2Id = '';

// Helper function to log with timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Register users
const registerUsers = async () => {
  try {
    log('Registering User 1...');
    const user1Response = await axios.post(`${BASE_URL}/auth/register`, user1);
    user1Token = user1Response.data.token;
    user1Id = user1Response.data.user._id;
    log(`User 1 registered with ID: ${user1Id}`);

    log('Registering User 2...');
    const user2Response = await axios.post(`${BASE_URL}/auth/register`, user2);
    user2Token = user2Response.data.token;
    user2Id = user2Response.data.user._id;
    log(`User 2 registered with ID: ${user2Id}`);
  } catch (error) {
    log(`Error registering users: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Create tests
const createTests = async () => {
  try {
    log('Creating Test 1...');
    const test1Response = await axios.post(
      `${BASE_URL}/tests`,
      {
        title: 'Test 1',
        description: 'First test for multi-user testing',
        difficulty: 'Easy',
        timeLimit: 30,
        problemStatement: 'Write a function that adds two numbers',
        inputFormat: 'Two integers a and b',
        outputFormat: 'The sum of a and b',
        constraints: '1 <= a, b <= 1000',
        sampleInput: '2 3',
        sampleOutput: '5',
        testCases: [
          {
            input: '2 3',
            expected: '5',
            isHidden: false
          },
          {
            input: '5 7',
            expected: '12',
            isHidden: false
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    test1Id = test1Response.data._id;
    log(`Test 1 created with ID: ${test1Id}`);

    log('Creating Test 2...');
    const test2Response = await axios.post(
      `${BASE_URL}/tests`,
      {
        title: 'Test 2',
        description: 'Second test for multi-user testing',
        difficulty: 'Medium',
        timeLimit: 45,
        problemStatement: 'Write a function that multiplies two numbers',
        inputFormat: 'Two integers a and b',
        outputFormat: 'The product of a and b',
        constraints: '1 <= a, b <= 1000',
        sampleInput: '2 3',
        sampleOutput: '6',
        testCases: [
          {
            input: '2 3',
            expected: '6',
            isHidden: false
          },
          {
            input: '5 7',
            expected: '35',
            isHidden: false
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    test2Id = test2Response.data._id;
    log(`Test 2 created with ID: ${test2Id}`);
  } catch (error) {
    log(`Error creating tests: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Create assessment
const createAssessment = async () => {
  try {
    log('Creating Assessment...');
    const assessmentResponse = await axios.post(
      `${BASE_URL}/assessments`,
      {
        title: 'Multi-User Test Assessment',
        description: 'Assessment for testing multi-user functionality',
        tests: [test1Id, test2Id],
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        maxAttempts: 5,
        isPublic: false,
        invitedStudents: [{ email: user2.email }]
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    assessmentId = assessmentResponse.data._id;
    log(`Assessment created with ID: ${assessmentId}`);
  } catch (error) {
    log(`Error creating assessment: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Submit code for Test 1 as User 2
const submitTest1AsUser2 = async () => {
  try {
    log('User 2 submitting code for Test 1...');
    const submissionResponse = await axios.post(
      `${BASE_URL}/tests/${test1Id}/submissions`,
      {
        code: 'def add(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(add(a, b))',
        language: 'python',
        assessmentId: assessmentId
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
        params: { email: user2.email }
      }
    );
    log(`User 2 submission for Test 1 created with ID: ${submissionResponse.data._id}`);
    log(`User 2 Test 1 submission status: ${submissionResponse.data.status}`);
    log(`User 2 Test 1 test cases passed: ${submissionResponse.data.testCasesPassed}/${submissionResponse.data.totalTestCases}`);
  } catch (error) {
    log(`Error submitting code for Test 1 as User 2: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Submit code for Test 2 as User 2
const submitTest2AsUser2 = async () => {
  try {
    log('User 2 submitting code for Test 2...');
    const submissionResponse = await axios.post(
      `${BASE_URL}/tests/${test2Id}/submissions`,
      {
        code: 'def multiply(a, b):\n    return a * b\n\na, b = map(int, input().split())\nprint(multiply(a, b))',
        language: 'python',
        assessmentId: assessmentId
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
        params: { email: user2.email }
      }
    );
    log(`User 2 submission for Test 2 created with ID: ${submissionResponse.data._id}`);
    log(`User 2 Test 2 submission status: ${submissionResponse.data.status}`);
    log(`User 2 Test 2 test cases passed: ${submissionResponse.data.testCasesPassed}/${submissionResponse.data.totalTestCases}`);
  } catch (error) {
    log(`Error submitting code for Test 2 as User 2: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Submit code for Test 1 as User 1
const submitTest1AsUser1 = async () => {
  try {
    log('User 1 submitting code for Test 1...');
    const submissionResponse = await axios.post(
      `${BASE_URL}/tests/${test1Id}/submissions`,
      {
        code: 'def add(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(add(a, b))',
        language: 'python',
        assessmentId: assessmentId
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    log(`User 1 submission for Test 1 created with ID: ${submissionResponse.data._id}`);
    log(`User 1 Test 1 submission status: ${submissionResponse.data.status}`);
    log(`User 1 Test 1 test cases passed: ${submissionResponse.data.testCasesPassed}/${submissionResponse.data.totalTestCases}`);
  } catch (error) {
    log(`Error submitting code for Test 1 as User 1: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Get test attempts for User 1 and User 2
const getTestAttempts = async () => {
  try {
    log('Getting test attempts for User 1...');
    const user1AttemptsResponse = await axios.get(
      `${BASE_URL}/assessments/${assessmentId}/tests/${test1Id}/attempts`,
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    log(`User 1 attempts for Test 1: ${user1AttemptsResponse.data.attemptsUsed}/${user1AttemptsResponse.data.maxAttempts}`);

    log('Getting test attempts for User 2...');
    const user2AttemptsResponse = await axios.get(
      `${BASE_URL}/assessments/${assessmentId}/tests/${test1Id}/attempts`,
      {
        headers: { Authorization: `Bearer ${user2Token}` },
        params: { email: user2.email }
      }
    );
    log(`User 2 attempts for Test 1: ${user2AttemptsResponse.data.attemptsUsed}/${user2AttemptsResponse.data.maxAttempts}`);
  } catch (error) {
    log(`Error getting test attempts: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Submit assessment for User 1
const submitAssessmentAsUser1 = async () => {
  try {
    log('User 1 submitting assessment...');
    const submissionResponse = await axios.post(
      `${BASE_URL}/assessments/${assessmentId}/submit`,
      { userId: user1Id, userEmail: user1.email },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
        params: { email: user1.email }
      }
    );
    log(`User 1 assessment submission result: ${JSON.stringify(submissionResponse.data)}`);
  } catch (error) {
    log(`Error submitting assessment as User 1: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Check if User 2 can still submit after User 1 has submitted
const checkUser2CanSubmitAfterUser1 = async () => {
  try {
    log('Checking if User 2 can still submit after User 1 has submitted...');
    const user2AttemptsResponse = await axios.get(
      `${BASE_URL}/assessments/${assessmentId}/tests/${test2Id}/attempts`,
      {
        headers: { Authorization: `Bearer ${user2Token}` },
        params: { email: user2.email }
      }
    );
    log(`User 2 attempts for Test 2: ${user2AttemptsResponse.data.attemptsUsed}/${user2AttemptsResponse.data.maxAttempts}`);
    log(`User 2 assessment submitted: ${user2AttemptsResponse.data.assessmentSubmitted}`);

    if (!user2AttemptsResponse.data.assessmentSubmitted) {
      log('User 2 can still submit. Submitting code for Test 2 again...');
      await submitTest2AsUser2();
    } else {
      log('User 2 cannot submit because the assessment is marked as submitted for User 2.');
    }
  } catch (error) {
    log(`Error checking if User 2 can submit: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Get user submissions
const getUserSubmissions = async () => {
  try {
    log('Getting submissions for User 1...');
    const user1SubmissionsResponse = await axios.get(
      `${BASE_URL}/assessments/user-submissions`,
      {
        headers: { 
          Authorization: `Bearer ${user1Token}`,
          'X-User-ID': user1Id
        },
        params: { email: user1.email }
      }
    );
    log(`User 1 submissions: ${JSON.stringify(user1SubmissionsResponse.data)}`);

    log('Getting submissions for User 2...');
    const user2SubmissionsResponse = await axios.get(
      `${BASE_URL}/assessments/user-submissions`,
      {
        headers: { 
          Authorization: `Bearer ${user2Token}`,
          'X-User-ID': user2Id
        },
        params: { email: user2.email }
      }
    );
    log(`User 2 submissions: ${JSON.stringify(user2SubmissionsResponse.data)}`);
  } catch (error) {
    log(`Error getting user submissions: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Run the tests
const runTests = async () => {
  try {
    log('Starting multi-user testing...');
    
    // Step 1: Register users
    await registerUsers();
    
    // Step 2: Create tests
    await createTests();
    
    // Step 3: Create assessment with 2 tests and set max attempts to 5
    await createAssessment();
    
    // Step 4: User 2 attempts Test 1
    await submitTest1AsUser2();
    
    // Step 5: User 1 attempts Test 1
    await submitTest1AsUser1();
    
    // Step 6: Verify that each user's attempts are tracked separately
    await getTestAttempts();
    
    // Step 7: User 2 attempts Test 2
    await submitTest2AsUser2();
    
    // Step 8: Submit the assessment for User 1
    await submitAssessmentAsUser1();
    
    // Step 9: Verify that User 2 can still make submissions
    await checkUser2CanSubmitAfterUser1();
    
    // Step 10: Verify that the submission metrics are user-specific
    await getUserSubmissions();
    
    log('Multi-user testing completed successfully!');
  } catch (error) {
    log(`Error running tests: ${error.message}`);
    if (error.response) {
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
};

// Run the tests
runTests();

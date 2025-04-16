const mongoose = require('mongoose');
const User = require('./models/User');
const Assessment = require('./models/Assessment');
const Test = require('./models/Test');
const Submission = require('./models/Submission');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hackerrank_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('Connected to MongoDB');
  
  try {
    // Get users
    const assessor = await User.findOne({ email: '1' });
    const user2 = await User.findOne({ email: '2' });
    const user3 = await User.findOne({ email: '3' });
    
    console.log('Found users:');
    console.log('Assessor:', assessor._id, assessor.email);
    console.log('User 2:', user2._id, user2.email);
    console.log('User 3:', user3._id, user3.email);
    
    // Get template tests
    const tests = await Test.find({ isTemplate: true }).limit(3);
    console.log('Found template tests:', tests.length);
    
    // Create a new assessment for testing
    const assessment = new Assessment({
      title: 'Test Fix Assessment',
      description: 'Testing the fix for shared test completion status',
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      maxAttempts: 3,
      isPublic: false,
      tests: tests.map(test => test._id),
      invitedUsers: [
        { email: user2.email, status: 'Invited', lastAttempt: null },
        { email: user3.email, status: 'Invited', lastAttempt: null }
      ],
      createdBy: assessor._id,
      createdAt: new Date()
    });
    
    await assessment.save();
    console.log('Created new assessment:', assessment._id, assessment.title);
    
    // Simulate user 2 completing the first test
    console.log('Simulating user 2 completing the first test...');
    
    // Initialize testAttempts Map if it doesn't exist
    if (!assessment.testAttempts) {
      assessment.testAttempts = new Map();
    }
    
    // Get or create the user's test attempts Map
    let userTestAttempts = assessment.testAttempts.get(user2._id.toString());
    if (!userTestAttempts) {
      userTestAttempts = new Map();
      assessment.testAttempts.set(user2._id.toString(), userTestAttempts);
    }
    
    // Get or create the attempts for this specific test
    const testId = tests[0]._id.toString();
    let testAttempt = userTestAttempts.get(testId);
    if (!testAttempt) {
      testAttempt = { 
        attemptsUsed: 1, 
        lastAttemptAt: new Date(), 
        results: {
          testCasesPassed: 2,
          totalTestCases: 3,
          score: 67,
          submittedAt: new Date(),
          language: 'python'
        } 
      };
      userTestAttempts.set(testId, testAttempt);
    }
    
    // Update the Maps
    assessment.testAttempts.set(user2._id.toString(), userTestAttempts);
    
    // Save the assessment
    await assessment.save();
    console.log('Updated assessment with user 2 test attempt');
    
    // Create a submission for user 2
    const submission = new Submission({
      user: user2._id,
      test: tests[0]._id,
      assessment: assessment._id,
      code: 'print("Hello, World!")',
      language: 'python',
      status: 'completed',
      testCasesPassed: 2,
      totalTestCases: 3,
      score: 67,
      avgExecutionTime: 100,
      avgMemoryUsed: 20,
      submittedAt: new Date(),
      isAssessmentSubmission: false
    });
    
    await submission.save();
    console.log('Created submission for user 2:', submission._id);
    
    // Fetch the assessment to verify the test attempts
    const updatedAssessment = await Assessment.findById(assessment._id);
    
    console.log('Assessment testAttempts:');
    console.log(JSON.stringify(updatedAssessment.testAttempts, null, 2));
    
    // Check if user 2 has attempts
    const user2Attempts = updatedAssessment.testAttempts.get(user2._id.toString());
    console.log('User 2 attempts:', user2Attempts ? 'Found' : 'Not found');
    
    // Check if user 3 has attempts
    const user3Attempts = updatedAssessment.testAttempts.get(user3._id.toString());
    console.log('User 3 attempts:', user3Attempts ? 'Found' : 'Not found');
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
});

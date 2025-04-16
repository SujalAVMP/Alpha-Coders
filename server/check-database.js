const mongoose = require('mongoose');
const Assessment = require('./models/Assessment');
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
    // Get all assessments
    const assessments = await Assessment.find();
    console.log(`Found ${assessments.length} assessments`);
    
    // Check each assessment for testAttempts
    for (const assessment of assessments) {
      console.log(`\nAssessment: ${assessment.title} (${assessment._id})`);
      
      // Check if testAttempts is a Map
      if (assessment.testAttempts instanceof Map) {
        console.log('testAttempts is a Map with', assessment.testAttempts.size, 'entries');
        
        // Print each user's attempts
        for (const [userId, userAttempts] of assessment.testAttempts.entries()) {
          console.log(`  User ${userId} has attempts:`);
          
          if (userAttempts instanceof Map) {
            console.log(`    ${userAttempts.size} test attempts`);
            
            for (const [testId, attempt] of userAttempts.entries()) {
              console.log(`    Test ${testId}: ${attempt.attemptsUsed} attempts used`);
            }
          } else {
            console.log(`    Not a Map: ${typeof userAttempts}`);
          }
        }
      } else {
        console.log('testAttempts is not a Map:', typeof assessment.testAttempts);
        console.log(assessment.testAttempts);
      }
      
      // Check userSubmissions
      if (assessment.userSubmissions instanceof Map) {
        console.log('userSubmissions is a Map with', assessment.userSubmissions.size, 'entries');
        
        for (const [userId, submission] of assessment.userSubmissions.entries()) {
          console.log(`  User ${userId} submission:`, submission.submitted ? 'Submitted' : 'Not submitted');
        }
      } else {
        console.log('userSubmissions is not a Map:', typeof assessment.userSubmissions);
      }
    }
    
    // Get all submissions
    const submissions = await Submission.find();
    console.log(`\nFound ${submissions.length} submissions`);
    
    // Group submissions by assessment
    const submissionsByAssessment = {};
    for (const submission of submissions) {
      if (submission.assessment) {
        const assessmentId = submission.assessment.toString();
        if (!submissionsByAssessment[assessmentId]) {
          submissionsByAssessment[assessmentId] = [];
        }
        submissionsByAssessment[assessmentId].push(submission);
      }
    }
    
    // Print submissions by assessment
    for (const [assessmentId, assessmentSubmissions] of Object.entries(submissionsByAssessment)) {
      console.log(`\nAssessment ${assessmentId} has ${assessmentSubmissions.length} submissions:`);
      
      // Group by user
      const submissionsByUser = {};
      for (const submission of assessmentSubmissions) {
        const userId = submission.user.toString();
        if (!submissionsByUser[userId]) {
          submissionsByUser[userId] = [];
        }
        submissionsByUser[userId].push(submission);
      }
      
      // Print submissions by user
      for (const [userId, userSubmissions] of Object.entries(submissionsByUser)) {
        console.log(`  User ${userId} has ${userSubmissions.length} submissions`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
});

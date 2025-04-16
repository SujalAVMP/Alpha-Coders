const mongoose = require('mongoose');
const Assessment = require('./models/Assessment');
const User = require('./models/User');

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
    // Get our test assessment
    const assessment = await Assessment.findById('67ff33ef3e44d7000a70efeb');
    console.log(`Found assessment: ${assessment.title} (${assessment._id})`);
    
    // Get users
    const user2 = await User.findOne({ email: '2' });
    const user3 = await User.findOne({ email: '3' });
    
    console.log('User 2:', user2._id, user2.email);
    console.log('User 3:', user3._id, user3.email);
    
    // Check if assessment is submitted for user 2
    const user2Submission = assessment.userSubmissions.get(user2._id.toString());
    console.log('User 2 submission status:', user2Submission ? 
      (user2Submission.submitted ? 'Submitted' : 'Not submitted') : 'No submission record');
    
    // Check if assessment is submitted for user 3
    const user3Submission = assessment.userSubmissions.get(user3._id.toString());
    console.log('User 3 submission status:', user3Submission ? 
      (user3Submission.submitted ? 'Submitted' : 'Not submitted') : 'No submission record');
    
    // Simulate user 2 submitting the assessment
    if (!user2Submission || !user2Submission.submitted) {
      console.log('Simulating user 2 submitting the assessment...');
      
      // Initialize userSubmissions Map if it doesn't exist
      if (!assessment.userSubmissions) {
        assessment.userSubmissions = new Map();
      }
      
      // Set user 2's submission status
      assessment.userSubmissions.set(user2._id.toString(), {
        submitted: true,
        submittedAt: new Date()
      });
      
      // Save the assessment
      await assessment.save();
      console.log('Assessment updated with user 2 submission');
    }
    
    // Verify the submission status again
    const updatedAssessment = await Assessment.findById('67ff33ef3e44d7000a70efeb');
    
    // Check user 2's submission status
    const updatedUser2Submission = updatedAssessment.userSubmissions.get(user2._id.toString());
    console.log('Updated user 2 submission status:', updatedUser2Submission ? 
      (updatedUser2Submission.submitted ? 'Submitted' : 'Not submitted') : 'No submission record');
    
    // Check user 3's submission status
    const updatedUser3Submission = updatedAssessment.userSubmissions.get(user3._id.toString());
    console.log('Updated user 3 submission status:', updatedUser3Submission ? 
      (updatedUser3Submission.submitted ? 'Submitted' : 'Not submitted') : 'No submission record');
    
    // Check the general submitted flag
    console.log('General submitted flag:', updatedAssessment.submitted);
    
    console.log('\nTest Results:');
    if (updatedUser2Submission && updatedUser2Submission.submitted && 
        (!updatedUser3Submission || !updatedUser3Submission.submitted) && 
        !updatedAssessment.submitted) {
      console.log('✅ TEST PASSED: User 2 has submitted the assessment, User 3 has not, and the general submitted flag is false');
    } else {
      console.log('❌ TEST FAILED: Submission status is not correctly isolated per user');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
});

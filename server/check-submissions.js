const mongoose = require('mongoose');
const { Submission, User } = require('./models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hackerrank_clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Assessment ID to check
  const assessmentId = '67ff7c71f99127555644727a';
  
  try {
    // Find all submissions for this assessment
    const submissions = await Submission.find({
      assessment: assessmentId,
      isAssessmentSubmission: true
    }).populate('user');
    
    console.log(`Found ${submissions.length} submissions for assessment ${assessmentId}`);
    
    // Print details of each submission
    for (const submission of submissions) {
      console.log('-----------------------------------');
      console.log('Submission ID:', submission._id);
      console.log('User:', submission.user ? `${submission.user.email} (${submission.user._id})` : 'Unknown');
      console.log('Submitted At:', submission.submittedAt);
      console.log('Status:', submission.status);
      console.log('Test Cases:', `${submission.testCasesPassed}/${submission.totalTestCases}`);
      console.log('Score:', submission.score);
    }
    
    // Check if there are any users with email "6" or "7"
    const users = await User.find({ email: { $in: ['6', '7'] } });
    console.log('\nUsers with email "6" or "7":');
    for (const user of users) {
      console.log(`${user.email} (${user._id})`);
    }
    
    // Check if there are any submissions from these users
    if (users.length > 0) {
      const userIds = users.map(u => u._id);
      const userSubmissions = await Submission.find({
        user: { $in: userIds },
        isAssessmentSubmission: true
      });
      
      console.log('\nSubmissions from users "6" or "7":');
      for (const submission of userSubmissions) {
        console.log(`${submission._id} - Assessment: ${submission.assessment} - User: ${submission.user}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

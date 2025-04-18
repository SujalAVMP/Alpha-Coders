const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { Test } = require('../models');
const sampleTestTemplates = require('../test-templates');
const standardTemplates = require('../standard-templates');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alpha_coders', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const seedTemplateTests = async () => {
  try {
    // Clear existing template tests
    await Test.deleteMany({ isTemplate: true });
    
    console.log('Deleted existing template tests');
    
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
    
    return insertedTemplates;
  } catch (error) {
    console.error('Error seeding template tests:', error);
    throw error;
  }
};

// Run the seed function
seedTemplateTests()
  .then(() => {
    console.log('Template tests seeded successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding template tests:', err);
    process.exit(1);
  });

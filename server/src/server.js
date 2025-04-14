const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Routes
console.log('Loading routes...');
try {
  const authRoutes = require('./routes/auth');
  console.log('Auth routes loaded:', Object.keys(authRoutes));
  app.use('/api/auth', authRoutes);

  const testsRoutes = require('./routes/tests');
  app.use('/api/tests', testsRoutes);

  const codeRoutes = require('./routes/code');
  app.use('/api/code', codeRoutes);

  const testRoutes = require('./routes/test');
  app.use('/api/test', testRoutes);

  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

// Default route
app.get('/', (req, res) => {
  res.send('Dulange Competitive Coding Platform API');
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codingplatform');
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

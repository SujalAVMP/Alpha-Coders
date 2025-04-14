/**
 * Authentication middleware for the Coding Platform
 * 
 * This file implements JWT-based authentication middleware.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/db');

// Secret key for JWT
const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Generate a JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user has assessor role
const isAssessor = (req, res, next) => {
  if (req.user && req.user.role === 'assessor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Assessor role required.' });
  }
};

// Check if user has assessee role
const isAssessee = (req, res, next) => {
  if (req.user && req.user.role === 'assessee') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Assessee role required.' });
  }
};

// Check if user is either an assessor or the specific assessee
const isAssessorOrSelf = (req, res, next) => {
  if (req.user && (req.user.role === 'assessor' || req.user.id === req.params.userId)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  isAssessor,
  isAssessee,
  isAssessorOrSelf
};

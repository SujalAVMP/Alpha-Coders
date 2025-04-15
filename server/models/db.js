/**
 * MongoDB models for the Coding Platform
 *
 * This file exports the MongoDB models for the application.
 */

const mongoose = require('mongoose');
const User = require('./User');
const Test = require('./Test');
const Assessment = require('./Assessment');
const Submission = require('./Submission');
const Notification = require('./Notification');
const Session = require('./Session');

// Initialize empty database
function initializeData() {
  // No sample data initialization
  console.log('MongoDB models initialized');
}

module.exports = {
  User,
  Test,
  Assessment,
  Submission,
  Notification,
  Session,
  initializeData
};

const mongoose = require('mongoose');
const User = require('./User');
const Test = require('./Test');
const Assessment = require('./Assessment');
const Submission = require('./Submission');
const Notification = require('./Notification');
const Session = require('./Session');

module.exports = {
  User,
  Test,
  Assessment,
  Submission,
  Notification,
  Session
};

const express = require('express');
const router = express.Router();

// @route   GET /api/test
// @desc    Test route
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Test route is working' });
});

module.exports = router;

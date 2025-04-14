/**
 * User routes for the Coding Platform
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models/db');
const { authenticateToken, isAssessor, isAssessorOrSelf } = require('../middleware/auth');

const router = express.Router();

// Get all users (assessor only)
router.get('/', authenticateToken, isAssessor, async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users by role (assessor only)
router.get('/role/:role', authenticateToken, isAssessor, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['assessor', 'assessee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "assessor" or "assessee"' });
    }
    
    const users = await User.getByRole(role);
    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific user (self or assessor)
router.get('/:id', authenticateToken, isAssessorOrSelf, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user (self only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }
    
    const { name, email, password } = req.body;
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update user
    const updatedUser = await User.update(req.params.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (self only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is deleting their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own profile.' });
    }
    
    // Delete user
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change user role (assessor only)
router.put('/:id/role', authenticateToken, isAssessor, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!['assessor', 'assessee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "assessor" or "assessee"' });
    }
    
    // Update user role
    const updatedUser = await User.update(req.params.id, { role });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

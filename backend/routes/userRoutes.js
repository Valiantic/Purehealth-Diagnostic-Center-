const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register user details
router.post('/register', userController.registerUserDetails);

// Find user by email (for login)
router.post('/find', userController.findUserByEmail);

// Get all users 
router.get('/all', userController.getAllUsers);

// Get user by ID
router.get('/:userId', userController.getUserById);

// Update user status
router.patch('/:userId/status', userController.updateUserStatus);

// Update user details
router.put('/:userId', userController.updateUserDetails);

// Verify admin role (for sensitive operations)
router.post('/verify-admin', userController.verifyAdminRole);

module.exports = router;
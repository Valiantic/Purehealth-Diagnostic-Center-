const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register user details
router.post('/register', userController.registerUserDetails);

// Find user by email (for login)
router.post('/find', userController.findUserByEmail);

module.exports = router; 
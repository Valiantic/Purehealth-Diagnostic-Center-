const { User, Authenticator } = require('../models');

async function registerUserDetails(req, res) {
  try {
    const { email, firstName, middleName, lastName } = req.body;

    // Validate input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      firstName,
      middleName: middleName || null,
      lastName
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
}

async function findUserByEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Username'
      });
    }

    // Check if user has authenticators
    const authenticators = await Authenticator.findAll({
      where: { userId: user.userId }
    });

    if (authenticators.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No authenticators found for this user'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding user',
      error: error.message
    });
  }
}

module.exports = {
  registerUserDetails,
  findUserByEmail
}; 
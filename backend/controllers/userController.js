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

async function getAllUsers(req, res) {
  try {
    // Get all users with role and status included in attributes
    const users = await User.findAll({
      attributes: ['userId', 'firstName', 'middleName', 'lastName', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users: users.map(user => ({
        userId: user.userId,
        name: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
        username: user.email.split('@')[0], 
        email: user.email,
        role: user.role,
        status: user.status, 
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate input
    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: 'User ID and status are required'
      });
    }

    // Validate status value
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either active or inactive'
      });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    await user.update({ status });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        userId: user.userId,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
}

module.exports = {
  registerUserDetails,
  findUserByEmail,
  getAllUsers,
  updateUserStatus
};
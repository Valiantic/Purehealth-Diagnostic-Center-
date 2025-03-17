const { User } = require('../models');
const {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse
} = require('../utils/webauthn-helpers');

// Generate registration options
async function registrationOptions(req, res) {
  try {
    const { userId, isPrimary = true } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
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

    // Generate registration options
    const options = await generateRegOptions(user, isPrimary);

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating registration options',
      error: error.message
    });
  }
}

// Verify registration response
async function registrationVerify(req, res) {
  try {
    const { userId, response, isPrimary = true } = req.body;

    if (!userId || !response) {
      return res.status(400).json({
        success: false,
        message: 'User ID and response are required'
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

    // Verify registration response
    const verification = await verifyRegResponse(user, response, isPrimary);

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: 'Registration verification failed'
      });
    }

    res.json({
      success: true,
      message: isPrimary ? 'Primary passkey registered successfully' : 'Backup passkey registered successfully'
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying registration',
      error: error.message
    });
  }
}

// Generate authentication options
async function authenticationOptions(req, res) {
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
        message: 'User not found'
      });
    }

    // Generate authentication options
    const options = await generateAuthOptions(user);

    res.json({
      success: true,
      options,
      userId: user.userId
    });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating authentication options',
      error: error.message
    });
  }
}

// Verify authentication response
async function authenticationVerify(req, res) {
  try {
    const { userId, response } = req.body;

    if (!userId || !response) {
      return res.status(400).json({
        success: false,
        message: 'User ID and response are required'
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

    // Verify authentication response
    const verification = await verifyAuthResponse(user, response);

    if (!verification.verified) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying authentication',
      error: error.message
    });
  }
}

module.exports = {
  registrationOptions,
  registrationVerify,
  authenticationOptions,
  authenticationVerify
}; 
const { User, Authenticator } = require('../models');
const { v4: uuidv4 } = require('uuid');
const {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse
} = require('../utils/webauthn-helpers');
const { logActivity } = require('../utils/activityLogger');

// Store temporary registrations with expiration (in a real app, use Redis or a database)
const tempRegistrations = new Map();

// Clean up expired temp registrations periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, reg] of tempRegistrations.entries()) {
    if (now > reg.expiresAt) {
      tempRegistrations.delete(id);
    }
  }
}, 60000); // Clean up every minute

// Generate temporary registration options (no user created yet)
async function tempRegistrationOptions(req, res) {
  try {
    const { clientOrigin, ...userData } = req.body;
    
    
    // Validate input
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create a temporary ID for this registration
    const tempRegistrationId = uuidv4();
    
    // Create a temporary user object for WebAuthn registration
    const tempUser = {
      userId: tempRegistrationId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isTemporary: true,  
      clientOrigin: clientOrigin 
    };
    
    // Generate registration options
    const optionsResult = await generateRegOptions(tempUser, true);
    const options = optionsResult;
    
    // Store the temp registration with expiration (30 minutes)
    tempRegistrations.set(tempRegistrationId, {
      userData,
      currentChallenge: options.challenge, // Store the challenge here
      expiresAt: Date.now() + 30 * 60 * 1000
    });
    
    // Remove the challenge from the options response for security
    const clientOptions = { ...options };
    // Keep the challenge in the clientOptions because the client needs it
    
    res.json({
      success: true,
      tempRegistrationId,
      options: clientOptions
    });
  } catch (error) {
    console.error('Error generating temp registration options:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating registration options',
      error: error.message
    });
  }
}

// Verify temporary registration and create user
async function tempRegistrationVerify(req, res) {
  try {
    const { tempRegistrationId, response, userData, clientOrigin } = req.body;
    
    // Check if temp registration exists
    if (!tempRegistrations.has(tempRegistrationId)) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired or invalid'
      });
    }
    
    const tempReg = tempRegistrations.get(tempRegistrationId);
    
    // Create a temporary user object for verification with the stored challenge
    const tempUser = {
      userId: tempRegistrationId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      currentChallenge: tempReg.currentChallenge,
      isTemporary: true  // Flag to indicate this is not a Sequelize model
    };
    
    try {
      const verification = await verifyRegResponse(tempUser, response, true, clientOrigin);
      
      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message: 'Passkey verification failed'
        });
      }
      
      // NOW create the user in the database after verification
      const user = await User.create({
        email: userData.email,
        firstName: userData.firstName,
        middleName: userData.middleName || null,
        lastName: userData.lastName,
        role: userData.role || 'receptionist' // Use provided role or default to receptionist
      });
      
      // Instead of updating the existing authenticator object, create a new one with the real user ID
      const authenticatorData = verification.authenticator.get({ plain: true });
      
      // Create a new authenticator record with the real user ID
      await Authenticator.create({
        userId: user.userId,
        credentialId: authenticatorData.credentialId,
        credentialPublicKey: authenticatorData.credentialPublicKey,
        counter: authenticatorData.counter,
        credentialDeviceType: authenticatorData.credentialDeviceType,
        credentialBackedUp: authenticatorData.credentialBackedUp,
        transports: authenticatorData.transports || [],
        isPrimary: true
      });
      
      // Log activity for account creation
      await logActivity({
        userId: user.userId,
        action: 'CREATE_ACCOUNT',
        resourceType: 'USER',
        resourceId: user.userId,
        details: `New user account created for ${user.email}`,
        ipAddress: req.ip
      });
      
      // Clean up the temporary registration
      tempRegistrations.delete(tempRegistrationId);
      
      res.json({
        success: true,
        message: 'User registered successfully with passkey',
        user: {
          userId: user.userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Passkey verification error:', error);
      return res.status(400).json({
        success: false,
        message: `Passkey verification failed: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Error verifying temp registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration verification',
      error: error.message || 'Unknown error'
    });
  }
}

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
    const { userId, response, isPrimary = true, clientOrigin } = req.body;

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

    const verification = await verifyRegResponse(user, response, isPrimary, clientOrigin);

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

    // Find the user upon logging in 
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Credential'
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
    const { userId, response, clientOrigin } = req.body;

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

    const verification = await verifyAuthResponse(user, response, clientOrigin);

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
  tempRegistrationOptions,
  tempRegistrationVerify,
  registrationOptions,
  registrationVerify,
  authenticationOptions,
  authenticationVerify
};
const { User, Authenticator } = require('../models');
const { v4: uuidv4 } = require('uuid');
const {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse
} = require('../utils/webauthn-helpers');
const { logActivity } = require('../utils/activityLogger');

const tempRegistrations = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [id, reg] of tempRegistrations.entries()) {
    if (now > reg.expiresAt) {
      tempRegistrations.delete(id);
    }
  }
}, 60000); 

// Generate temporary registration options for new users
exports.tempRegistrationOptions = async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.email || !userData.firstName || !userData.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required'
      });
    }
    
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const tempRegistrationId = uuidv4();
    
    const tempUser = {
      userId: tempRegistrationId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isTemporary: true  
    };
    
    const optionsResult = await generateRegOptions(tempUser, true);
    const options = optionsResult;
    
    tempRegistrations.set(tempRegistrationId, {
      userData,
      currentChallenge: options.challenge, 
      expiresAt: Date.now() + 30 * 60 * 1000
    });
    
    const clientOptions = { ...options };
    
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
exports.tempRegistrationVerify = async (req, res) => {
  try {
    const { tempRegistrationId, response, userData } = req.body;
    
    if (!tempRegistrations.has(tempRegistrationId)) {
      return res.status(400).json({
        success: false,
        message: 'Registration session expired or invalid'
      });
    }
    
    const tempReg = tempRegistrations.get(tempRegistrationId);
    
    const tempUser = {
      userId: tempRegistrationId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      currentChallenge: tempReg.currentChallenge,
      isTemporary: true  
    };
    
    try {
      const verification = await verifyRegResponse(tempUser, response, true);
      
      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message: 'Passkey verification failed'
        });
      }
      
       const user = await User.create({
        email: userData.email,
        firstName: userData.firstName,
        middleName: userData.middleName || null,
        lastName: userData.lastName,
        role: userData.role || 'receptionist' 
      });
      
      const authenticatorData = verification.authenticator.get({ plain: true });
      
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
      
      await logActivity({
        userId: user.userId,
        action: 'CREATE_ACCOUNT',
        resourceType: 'USER',
        resourceId: user.userId,
        details: `New user account created for ${user.email}`,
        ipAddress: req.ip
      });
      
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
exports.registrationOptions = async (req, res) => {
  try {
    const { userId, isPrimary = true } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
exports.registrationVerify = async (req, res) => {
  try {
    const { userId, response, isPrimary = true } = req.body;

    if (!userId || !response) {
      return res.status(400).json({
        success: false,
        message: 'User ID and response are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
exports.authenticationOptions = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Credential'
      });
    }

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
exports.authenticationVerify = async (req, res) => {
  try {
    const { userId, response } = req.body;

    if (!userId || !response) {
      return res.status(400).json({
        success: false,
        message: 'User ID and response are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

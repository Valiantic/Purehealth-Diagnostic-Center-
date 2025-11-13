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
    const userData = req.body;
    
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
      isTemporary: true  // Flag to indicate this is not a Sequelize model
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
    const { tempRegistrationId, response, userData } = req.body;
    
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
      // Verify registration response
      const verification = await verifyRegResponse(tempUser, response, true);
      
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
      
      // Get the authenticator data (either from Sequelize model or plain object)
      const authenticatorData = verification.authenticator.get
        ? verification.authenticator.get({ plain: true })
        : verification.authenticator.get();
      
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

// Get user's passkeys
async function getUserPasskeys(req, res) {
  try {
    const { userId } = req.params;

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

    // Get all authenticators for the user
    const authenticators = await Authenticator.findAll({
      where: { userId },
      order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      passkeys: authenticators
    });
  } catch (error) {
    console.error('Error fetching user passkeys:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching passkeys',
      error: error.message
    });
  }
}

// Delete a passkey
async function deletePasskey(req, res) {
  try {
    const { passkeyId } = req.params;

    if (!passkeyId) {
      return res.status(400).json({
        success: false,
        message: 'Passkey ID is required'
      });
    }

    // Find the passkey
    const passkey = await Authenticator.findByPk(passkeyId);
    if (!passkey) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found'
      });
    }

    // Check if this is the only passkey for the user
    const userPasskeyCount = await Authenticator.count({
      where: { userId: passkey.userId }
    });

    if (userPasskeyCount === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining passkey'
      });
    }

    // If deleting primary passkey, make another one primary
    if (passkey.isPrimary) {
      const otherPasskey = await Authenticator.findOne({
        where: { 
          userId: passkey.userId, 
          id: { [require('sequelize').Op.ne]: passkeyId }
        }
      });
      
      if (otherPasskey) {
        await otherPasskey.update({ isPrimary: true });
      }
    }

    // Delete the passkey
    await passkey.destroy();

    // Log activity
    await logActivity({
      userId: passkey.userId,
      action: 'DELETE_PASSKEY',
      resourceType: 'AUTHENTICATOR',
      resourceId: passkeyId,
      details: 'Passkey deleted',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Passkey deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting passkey:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting passkey',
      error: error.message
    });
  }
}

// Set passkey as primary
async function setPrimaryPasskey(req, res) {
  try {
    const { passkeyId } = req.params;

    if (!passkeyId) {
      return res.status(400).json({
        success: false,
        message: 'Passkey ID is required'
      });
    }

    // Find the passkey
    const passkey = await Authenticator.findByPk(passkeyId);
    if (!passkey) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found'
      });
    }

    // Update all passkeys for this user to not be primary
    await Authenticator.update(
      { isPrimary: false },
      { where: { userId: passkey.userId } }
    );

    // Set the selected passkey as primary
    await passkey.update({ isPrimary: true });

    // Log activity
    await logActivity({
      userId: passkey.userId,
      action: 'SET_PRIMARY_PASSKEY',
      resourceType: 'AUTHENTICATOR',
      resourceId: passkeyId,
      details: 'Passkey set as primary',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Primary passkey updated successfully'
    });
  } catch (error) {
    console.error('Error setting primary passkey:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary passkey',
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
  authenticationVerify,
  getUserPasskeys,
  deletePasskey,
  setPrimaryPasskey
};
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { rpID, rpName, expectedOrigin } = require('./webauthn-config');
const { User, Authenticator } = require('../models');

/**
 * Generate registration options for WebAuthn
 */
async function generateRegOptions(user, isPrimary = true) {
  // Check if this is a temporary user (not a Sequelize model)
  const isTemporaryUser = user.isTemporary === true;
  
  // Get existing authenticators for the user (skip for temporary users)
  const userAuthenticators = [];
  if (!isTemporaryUser) {
    const existingAuthenticators = await Authenticator.findAll({
      where: { userId: user.userId }
    });

    existingAuthenticators.forEach(authenticator => {
      userAuthenticators.push({
        id: Buffer.from(authenticator.credentialId, 'base64url'),
        type: 'public-key',
        transports: authenticator.transports
      });
    });
  }

  try {
    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.userId.toString(),
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      excludeCredentials: userAuthenticators,
      authenticatorSelection: {
        // Allow both platform and cross-platform authenticators
        authenticatorAttachment: undefined, // Let the user choose
        requireResidentKey: false, // More flexible for device compatibility
        residentKey: 'preferred', // Prefer resident keys but don't require
        userVerification: 'preferred' // Prefer user verification but don't require
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
      timeout: 60000 // 60 seconds
    });

    // Save the challenge to the user
    if (isTemporaryUser) {
      // For temporary users, we don't call save() but return the challenge
      return { ...options, challenge: options.challenge };
    } else {
      // For real users (Sequelize models), save the challenge to the database
      user.currentChallenge = options.challenge;
      await user.save();
      return options;
    }
  } catch (error) {
    console.error('Error generating registration options:', error);
    throw new Error(`Failed to generate registration options: ${error.message}`);
  }
}

/**
 * Verify registration response from client
 */
async function verifyRegResponse(user, response, isPrimary = true) {
  try {
    const expectedChallenge = user.currentChallenge;
    
    if (!expectedChallenge) {
      throw new Error('No challenge found for user. Please request new registration options.');
    }
    
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: false // More flexible for compatibility
      });
    } catch (error) {
      console.error('Verification error details:', error);
      
      // Provide more specific error messages
      if (error.message.includes('challenge')) {
        throw new Error('Challenge verification failed. Please try registering again.');
      } else if (error.message.includes('origin')) {
        throw new Error('Origin verification failed. Please ensure you are on the correct website.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Registration timed out. Please try again.');
      } else {
        throw new Error(`Registration verification failed: ${error.message}`);
      }
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const {
        credentialID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp
      } = registrationInfo;

      // For temporary users, create but don't save the authenticator yet
      if (user.isTemporary) {
        // Create authenticator in memory but don't save to DB yet
        const newAuthenticator = Authenticator.build({
          userId: user.userId, // Will be updated later with real user ID
          credentialId: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: response.response.transports || [],
          isPrimary
        });

        return {
          verified,
          authenticator: newAuthenticator
        };
      } else {
        // Check if this credential already exists
        const existingAuth = await Authenticator.findOne({
          where: {
            credentialId: Buffer.from(credentialID).toString('base64url')
          }
        });

        if (existingAuth) {
          throw new Error('This passkey is already registered to an account.');
        }

        // If adding a new primary passkey, update existing ones
        if (isPrimary) {
          await Authenticator.update(
            { isPrimary: false },
            { where: { userId: user.userId } }
          );
        }

        // For existing users, save the authenticator
        const newAuthenticator = await Authenticator.create({
          userId: user.userId,
          credentialId: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: response.response.transports || [],
          isPrimary
        });

        return {
          verified,
          authenticator: newAuthenticator
        };
      }
    }

    return { verified: false, error: 'Registration verification failed' };
  } catch (error) {
    console.error('Error in verifyRegResponse:', error);
    throw error; // Rethrow for proper error handling up the chain
  }
}

/**
 * Generate authentication options for WebAuthn
 */
async function generateAuthOptions(user) {
  // Get existing authenticators for the user
  const existingAuthenticators = await Authenticator.findAll({
    where: { userId: user.userId }
  });

  const allowCredentials = existingAuthenticators.map(authenticator => ({
    id: Buffer.from(authenticator.credentialId, 'base64url'),
    type: 'public-key',
    transports: authenticator.transports
  }));

  // Generate authentication options
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred'
  });

  // Save the challenge to the user
  user.currentChallenge = options.challenge;
  await user.save();

  return options;
}

/**
 * Verify authentication response from client
 */
async function verifyAuthResponse(user, response) {
  // Get the authenticator from the database
  const authenticator = await Authenticator.findOne({
    where: {
      userId: user.userId,
      credentialId: response.id
    }
  });

  if (!authenticator) {
    throw new Error('Authenticator not found');
  }

  const expectedChallenge = user.currentChallenge;

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialId, 'base64url'),
        credentialPublicKey: authenticator.credentialPublicKey,
        counter: authenticator.counter
      }
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    throw new Error(`Verification failed: ${error.message}`);
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Update the authenticator counter
    authenticator.counter = authenticationInfo.newCounter;
    await authenticator.save();
  }

  return { verified, authenticator };
}

module.exports = {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse
};
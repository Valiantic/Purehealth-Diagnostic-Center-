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

  // Don't exclude credentials - this allows the same device to register multiple passkeys
  // This is useful for backup passkeys on the same device
  // If you want to prevent duplicate devices, set excludeCredentials to the existing authenticators
  const userAuthenticators = [];

  // OPTIONAL: Uncomment the code below to prevent the same device from registering multiple times
  // if (!isTemporaryUser) {
  //   const existingAuthenticators = await Authenticator.findAll({
  //     where: { userId: user.userId }
  //   });
  //
  //   existingAuthenticators.forEach(authenticator => {
  //     userAuthenticators.push({
  //       id: Buffer.from(authenticator.credentialId, 'base64url'),
  //       type: 'public-key',
  //       transports: authenticator.transports
  //     });
  //   });
  // }

  // Generate registration options
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.userId.toString(),
    userName: user.email,
    userDisplayName: `${user.firstName} ${user.lastName}`,
    attestationType: 'none',
    excludeCredentials: userAuthenticators, // Empty array = no exclusions
    authenticatorSelection: {
      // For fingerprint, use platform authenticator
      authenticatorAttachment: isPrimary ? 'platform' : 'cross-platform',
      requireResidentKey: true,
      userVerification: 'preferred'
    }
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
}


/**
 * Verify registration response from client
 */
async function verifyRegResponse(user, response, isPrimary = true) {
  try {
    const expectedChallenge = user.currentChallenge;
    
    if (!expectedChallenge) {
      throw new Error('Challenge not found for user');
    }
    

   
    const needsConversion = typeof response.rawId === 'string' || Array.isArray(response.rawId);

    const formattedResponse = needsConversion ? {
      id: response.rawId,
      rawId: response.rawId,
      response: {
        attestationObject: response.response.attestationObject,
        clientDataJSON: response.response.clientDataJSON,
        transports: response.response.transports || []
      },
      type: response.type,
      clientExtensionResults: response.clientExtensionResults || {}
    } : response;

    if (needsConversion && formattedResponse.response.clientDataJSON) {
      try {
        const decodedClientData = Buffer.from(formattedResponse.response.clientDataJSON, 'base64url').toString('utf-8');
        const parsedClientData = JSON.parse(decodedClientData);
      } catch (e) {
        console.error('Error decoding clientDataJSON:', e.message);
      }
    }
    
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: formattedResponse,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID
      });
    } catch (error) {
      console.error('Registration verification error details:', error);
      console.error('Error message:', error.message);
      console.error('Formatted response id:', formattedResponse.id);
      console.error('Formatted response rawId type:', typeof formattedResponse.rawId);
      console.error('Formatted response rawId length:', formattedResponse.rawId?.length || formattedResponse.rawId?.byteLength);
      throw new Error(`Registration verification failed: ${error.message}`);
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
          transports: formattedResponse.response.transports || [],
          isPrimary
        });

        return {
          verified,
          authenticator: newAuthenticator
        };
      } else {
        // For existing users, save the authenticator
        const newAuthenticator = await Authenticator.create({
          userId: user.userId,
          credentialId: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter,
          credentialDeviceType,
          credentialBackedUp,
          transports: formattedResponse.response.transports || [],
          isPrimary
        });

        return {
          verified,
          authenticator: newAuthenticator
        };
      }
    }

    return { verified };
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
      response: response, 
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
    console.error('Failed with direct pass-through, error details:', {
      message: error.message,
      stack: error.stack
    });
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
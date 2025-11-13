const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { Authenticator } = require('../models');
const { rpName, rpID, expectedOrigin } = require('./webauthn-config');

/**
 * Generate registration options for WebAuthn
 */
async function generateRegOptions(user, isPrimary = true) {
  try {
    // Get existing authenticators for the user if it's not a temporary user
    let userAuthenticators = [];
    if (!user.isTemporary) {
      userAuthenticators = await Authenticator.findAll({
        where: { userId: user.userId }
      });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.userId,
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      excludeCredentials: userAuthenticators.map(auth => ({
        id: Buffer.from(auth.credentialId, 'base64'),
        type: 'public-key',
        transports: auth.transports || []
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    });

    // Store challenge in user object (or in a temporary storage)
    if (user.update) {
      await user.update({ currentChallenge: options.challenge });
    } else {
      // For temporary users, the challenge will be stored in the controller
      user.currentChallenge = options.challenge;
    }

    return options;
  } catch (error) {
    console.error('Error generating registration options:', error);
    throw error;
  }
}

/**
 * Verify registration response from WebAuthn
 */
async function verifyRegResponse(user, response, isPrimary = true) {
  try {
    // Get the expected challenge
    const expectedChallenge = user.currentChallenge;

    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: Array.isArray(expectedOrigin) ? expectedOrigin : [expectedOrigin],
      expectedRPID: rpID,
      requireUserVerification: false
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Create new authenticator record
      const newAuthenticator = await Authenticator.create({
        userId: user.userId,
        credentialId: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: response.response.transports || [],
        isPrimary
      });

      // Clear the challenge
      if (user.update) {
        await user.update({ currentChallenge: null });
      }

      return {
        verified: true,
        authenticator: newAuthenticator
      };
    }

    return { verified: false };
  } catch (error) {
    console.error('Error verifying registration:', error);
    throw error;
  }
}

/**
 * Generate authentication options for WebAuthn
 */
async function generateAuthOptions(user) {
  try {
    // Get user's authenticators
    const userAuthenticators = await Authenticator.findAll({
      where: { userId: user.userId }
    });

    if (userAuthenticators.length === 0) {
      throw new Error('No authenticators found for user');
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userAuthenticators.map(auth => ({
        id: Buffer.from(auth.credentialId, 'base64'),
        type: 'public-key',
        transports: auth.transports || []
      })),
      userVerification: 'preferred'
    });

    // Store challenge
    await user.update({ currentChallenge: options.challenge });

    return options;
  } catch (error) {
    console.error('Error generating authentication options:', error);
    throw error;
  }
}

/**
 * Verify authentication response from WebAuthn
 */
async function verifyAuthResponse(user, response) {
  try {
    const expectedChallenge = user.currentChallenge;

    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // Find the authenticator used
    const credentialId = Buffer.from(response.rawId, 'base64').toString('base64');
    const authenticator = await Authenticator.findOne({
      where: {
        userId: user.userId,
        credentialId
      }
    });

    if (!authenticator) {
      throw new Error('Authenticator not found');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: Array.isArray(expectedOrigin) ? expectedOrigin : [expectedOrigin],
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialId, 'base64'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
        counter: authenticator.counter
      },
      requireUserVerification: false
    });

    if (verification.verified) {
      // Update counter
      await authenticator.update({
        counter: verification.authenticationInfo.newCounter
      });

      // Clear challenge
      await user.update({ currentChallenge: null });

      return { verified: true };
    }

    return { verified: false };
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw error;
  }
}

module.exports = {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse
};
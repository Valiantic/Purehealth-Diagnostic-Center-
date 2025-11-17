import {
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';
import { webauthnAPI } from '../services/api';

/**
 * Start the registration process for a new user
 */
export async function registerUser(userData) {
  try {
    // Step 1: Get registration options for a temporary user
    const optionsResponse = await webauthnAPI.getTempRegistrationOptions(userData);
    const { options, tempRegistrationId } = optionsResponse.data;

    // Step 2: Always ensure we're using the correct RP ID
    if (options.rp) {
      console.log('Registration: Changing RP ID from', options.rp.id, 'to', window.location.hostname);
      options.rp.id = window.location.hostname;
    } else {
      console.error('Registration options missing rp object:', options);
    }

    // Step 3: Start registration with the browser WebAuthn API
    const attResp = await startRegistration(options);

    // Step 4: Verify registration with the server and create the user
    const verificationResponse = await webauthnAPI.verifyTempRegistration(tempRegistrationId, attResp, userData);

    return {
      success: true,
      userId: verificationResponse.data.user.userId,
      message: 'Account and passkey created successfully'
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle user cancellation specifically
    if (
      error.name === 'AbortError' ||
      error.message?.includes('The operation either timed out or was not allowed') ||
      error.message?.includes('user canceled')
    ) {
      return {
        success: false,
        message: 'Passkey registration was canceled. Your account has not been created.'
      };
    }

    // Better error message extraction from axios error responses
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || error.response.data.error || 'Registration failed'
      };
    }

    return {
      success: false,
      message: error.message || 'Registration failed due to an unexpected error'
    };
  }
}

/**
 * Register a backup passkey for an existing user
 */
export async function registerBackupPasskey(userId) {
  try {
    // Step 1: Get registration options for backup passkey
    const optionsResponse = await webauthnAPI.getRegistrationOptions(userId, false);
    const options = optionsResponse.data.options;

    // Step 2: Always ensure we're using the correct RP ID
    if (options.rp) {
      console.log('Backup registration: Changing RP ID from', options.rp.id, 'to', window.location.hostname);
      options.rp.id = window.location.hostname;
    } else {
      console.error('Backup registration options missing rp object:', options);
    }

    // Step 3: Start registration with the browser WebAuthn API
    const attResp = await startRegistration(options);

    // Step 4: Verify registration with the server
    const verificationResponse = await webauthnAPI.verifyRegistration(userId, attResp, false);

    return {
      success: true,
      message: 'Backup passkey registration successful'
    };
  } catch (error) {
    console.error('Backup registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Backup passkey registration failed'
    };
  }
}

/**
 * Authenticate a user using WebAuthn
 */
export async function authenticateUser(email) {
  try {
    // Step 1: Get authentication options from the server
    const optionsResponse = await webauthnAPI.getAuthenticationOptions(email);
    const { options, userId } = optionsResponse.data;

    // Step 2: Always set the RP ID to match the current hostname
    // This fixes issues where backend config might not match the actual frontend origin
    console.log('Authentication: Changing RP ID from', options.rpId, 'to', window.location.hostname);
    options.rpId = window.location.hostname;

    // Step 3: Start authentication with the browser WebAuthn API
    const authResp = await startAuthentication(options);

    // Step 4: Verify authentication with the server
    const verificationResponse = await webauthnAPI.verifyAuthentication(userId, authResp);

    return {
      success: true,
      user: verificationResponse.data.user,
      message: 'Authentication successful'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Authentication failed'
    };
  }
}

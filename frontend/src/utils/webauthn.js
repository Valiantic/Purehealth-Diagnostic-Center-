import {
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';
import { userAPI, webauthnAPI } from '../services/api';

/**
 * Start the registration process for a new user
 */
export async function registerUser(userData) {
  try {
    // Step 1: Register user details
    const userResponse = await userAPI.register(userData);
    const userId = userResponse.data.user.userId;
    
    // Step 2: Get registration options for primary passkey
    const optionsResponse = await webauthnAPI.getRegistrationOptions(userId, true);
    const options = optionsResponse.data.options;
    
    // Step 3: Start registration with the browser WebAuthn API
    const attResp = await startRegistration(options);
    
    // Step 4: Verify registration with the server
    const verificationResponse = await webauthnAPI.verifyRegistration(userId, attResp, true);
    
    return {
      success: true,
      userId,
      message: 'Primary passkey registration successful'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
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
    
    // Step 2: Start registration with the browser WebAuthn API
    const attResp = await startRegistration(options);
    
    // Step 3: Verify registration with the server
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
    
    // Step 2: Start authentication with the browser WebAuthn API
    const authResp = await startAuthentication(options);
    
    // Step 3: Verify authentication with the server
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
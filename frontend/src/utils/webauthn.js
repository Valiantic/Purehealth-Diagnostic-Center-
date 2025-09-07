import {
  startRegistration,
  startAuthentication
} from '@simplewebauthn/browser';
import { userAPI, webauthnAPI } from '../services/api';

/**
 * Convert base64url string to Uint8Array
 * @param {string} base64url - Base64url encoded string
 * @returns {Uint8Array}
 */
export function base64urlToUint8Array(base64url) {
  if (typeof base64url !== 'string') {
    return new Uint8Array(base64url);
  }
  
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const paddedBase64 = base64 + padding;
  
  try {
    // Decode base64 to binary string
    const binaryString = atob(paddedBase64);
    
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  } catch (error) {
    console.error('Error converting base64url to Uint8Array:', error);
    throw new Error('Invalid base64url string');
  }
}

/**
 * Check if WebAuthn is supported in the current browser
 * @returns {boolean}
 */
export function isWebAuthnSupported() {
  return !!(navigator.credentials && 
           navigator.credentials.create && 
           navigator.credentials.get &&
           window.PublicKeyCredential);
}

/**
 * Check if the current context is secure (HTTPS or localhost)
 * @returns {boolean}
 */
export function isSecureContext() {
  return window.isSecureContext || 
         location.hostname === 'localhost' || 
         location.hostname === '127.0.0.1';
}

/**
 * Get user-friendly error message for WebAuthn errors
 * @param {Error} error - WebAuthn error
 * @returns {string} - User-friendly error message
 */
export function getWebAuthnErrorMessage(error) {
  switch (error.name) {
    case 'NotAllowedError':
      return 'Passkey operation was cancelled or failed. This could be due to user cancellation, device not supported, or security requirements not met. Make sure you\'re using HTTPS and your device supports WebAuthn.';
    case 'InvalidStateError':
      return 'This passkey is already registered for this account.';
    case 'NotSupportedError':
      return 'Your device or browser does not support passkeys.';
    case 'SecurityError':
      return 'Security error - make sure you\'re using HTTPS or localhost.';
    case 'AbortError':
      return 'Passkey operation was cancelled.';
    case 'ConstraintError':
      return 'The device does not meet the requirements for this passkey.';
    case 'DataError':
      return 'Invalid data provided for passkey operation.';
    case 'NetworkError':
      return 'Network error occurred during passkey operation.';
    case 'UnknownError':
      return 'An unknown error occurred during passkey operation.';
    default:
      return `Passkey operation failed: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Start the registration process for a new user
 */
export async function registerUser(userData) {
  try {
    // Step 1: Get registration options for a temporary user
    const optionsResponse = await webauthnAPI.getTempRegistrationOptions(userData);
    const { options, tempRegistrationId } = optionsResponse.data;
    
    // Step 2: Start registration with the browser WebAuthn API
    const attResp = await startRegistration(options);
    
    // Step 3: Verify registration with the server and create the user
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
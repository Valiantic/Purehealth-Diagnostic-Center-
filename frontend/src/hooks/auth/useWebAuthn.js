import { useState, useCallback } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { webauthnAPI } from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Custom hook for WebAuthn authentication
 * Provides methods to trigger authentication and manage state
 */
export const useWebAuthn = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Reset authentication state
  const resetState = useCallback(() => {
    setIsAuthenticating(false);
    setIsModalOpen(false);
    setError(null);
    setPendingAction(null);
  }, []);

  /**
   * Authenticate user with WebAuthn
   * @param {string} email - User's email address
   * @param {Object} options - Authentication options
   * @returns {Promise<boolean>} - Success status
   */
  const authenticate = useCallback(async (email, options = {}) => {
    const { showToast = true, openModal = false } = options;

    if (!email) {
      const errorMsg = 'Email is required for authentication';
      setError(errorMsg);
      if (showToast) toast.error(errorMsg);
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    // Open modal if requested
    if (openModal) {
      setIsModalOpen(true);
    }

    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await webauthnAPI.getAuthenticationOptions(email);

      if (!optionsResponse.data?.success) {
        throw new Error(optionsResponse.data?.message || 'Failed to get authentication options');
      }

      const { options: authOptions, userId } = optionsResponse.data;

      // Step 2: Start WebAuthn authentication
      const authResponse = await startAuthentication(authOptions);

      // Step 3: Verify authentication with server
      const verificationResponse = await webauthnAPI.verifyAuthentication(userId, authResponse);

      if (!verificationResponse.data?.success) {
        throw new Error(verificationResponse.data?.message || 'Authentication verification failed');
      }

      setIsAuthenticating(false);
      if (openModal) {
        setIsModalOpen(false);
      }
      return true;

    } catch (error) {
      console.error('WebAuthn authentication error:', error);
      setIsAuthenticating(false);

      let errorMessage = 'Authentication failed';

      // Handle different types of errors
      if (error.name === 'AbortError' || error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled or not allowed';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Invalid authentication state. Please try again.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error during authentication';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
      return false;
    }
  }, []);

  /**
   * Trigger authentication with modal
   * @param {string} email - User's email
   * @param {Function} onSuccess - Callback function to execute on successful authentication
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  const triggerAuthentication = useCallback(async (email, onSuccess, options = {}) => {
    const { 
      message = 'Please authenticate with your passkey to continue',
      showModal = true 
    } = options;

    if (showModal) {
      setIsModalOpen(true);
      setPendingAction({ email, onSuccess, message });
    } else {
      // Direct authentication without modal
      const success = await authenticate(email, { showToast: true });
      if (success && onSuccess) {
        onSuccess();
      }
    }
  }, [authenticate]);

  /**
   * Execute the pending authentication
   */
  const executeAuthentication = useCallback(async () => {
    if (!pendingAction) return false;

    const { email, onSuccess } = pendingAction;
    const success = await authenticate(email, { showToast: true });

    if (success) {
      setIsModalOpen(false);
      setPendingAction(null);
      if (onSuccess) {
        onSuccess();
      }
      return true;
    }

    return false;
  }, [pendingAction, authenticate]);

  /**
   * Cancel authentication
   */
  const cancelAuthentication = useCallback(() => {
    setIsModalOpen(false);
    setPendingAction(null);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isAuthenticating,
    isModalOpen,
    error,
    pendingAction,

    // Actions
    authenticate,
    triggerAuthentication,
    executeAuthentication,
    cancelAuthentication,
    clearError,
    resetState
  };
};

export default useWebAuthn;
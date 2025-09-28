import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebAuthn } from './useWebAuthn';
import useAuth from './useAuth';

/**
 * Hook that provides WebAuthn-protected actions
 * Automatically triggers authentication before executing sensitive actions
 */
export const useProtectedAction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const webauthn = useWebAuthn();

  /**
   * Execute a protected action that requires WebAuthn authentication
   * @param {Function} action - The action to execute after successful authentication
   * @param {Object} options - Configuration options
   * @returns {Function} - Function that triggers the protected action
   */
  const executeProtectedAction = useCallback((action, options = {}) => {
    const {
      requireAuth = true,
      message = 'Please authenticate to perform this action',
      showToast = true,
      onError = null
    } = options;

    return async () => {
      try {
        // Check if user is logged in
        if (!user?.email) {
          throw new Error('User not authenticated');
        }

        // If authentication is required, trigger WebAuthn
        if (requireAuth) {
          await webauthn.triggerAuthentication(
            user.email,
            action,
            { message, showModal: true }
          );
        } else {
          // Execute action directly if no auth required
          action();
        }
      } catch (error) {
        console.error('Protected action error:', error);
        if (onError) {
          onError(error);
        }
      }
    };
  }, [user, webauthn]);

  /**
   * Navigate to a protected route with WebAuthn authentication
   * @param {string} path - The route path to navigate to
   * @param {Object} options - Configuration options
   */
  const navigateProtected = useCallback((path, options = {}) => {
    const {
      message = `Please authenticate to access ${path}`,
      state = null
    } = options;

    const navigationAction = () => {
      navigate(path, { state });
    };

    return executeProtectedAction(navigationAction, { 
      message,
      ...options 
    });
  }, [navigate, executeProtectedAction]);

  /**
   * Execute a function with WebAuthn protection
   * @param {Function} fn - The function to protect
   * @param {Object} options - Configuration options
   */
  const protectFunction = useCallback((fn, options = {}) => {
    return executeProtectedAction(fn, options);
  }, [executeProtectedAction]);

  /**
   * Create a protected version of any async function
   * @param {Function} asyncFn - The async function to protect
   * @param {Object} options - Configuration options
   */
  const protectAsyncFunction = useCallback((asyncFn, options = {}) => {
    const {
      message = 'Please authenticate to perform this action',
      onSuccess = null,
      onError = null
    } = options;

    const wrappedAction = async () => {
      try {
        const result = await asyncFn();
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (error) {
        console.error('Protected async function error:', error);
        if (onError) {
          onError(error);
        }
        throw error;
      }
    };

    return executeProtectedAction(wrappedAction, { 
      message,
      onError,
      ...options 
    });
  }, [executeProtectedAction]);

  /**
   * Shortcuts for common protected actions
   */
  const shortcuts = {
    // Protected navigation shortcuts
    goToAddTransaction: useCallback((options = {}) => {
      return navigateProtected('/add-transaction', {
        message: 'Please authenticate to add a new transaction',
        ...options
      });
    }, [navigateProtected]),

    goToAddExpenses: useCallback((options = {}) => {
      return navigateProtected('/add-expenses', {
        message: 'Please authenticate to add new expenses',
        ...options
      });
    }, [navigateProtected]),

    // Protected report generation
    generateReport: useCallback((reportFunction, options = {}) => {
      return protectAsyncFunction(reportFunction, {
        message: 'Please authenticate to generate the report',
        ...options
      });
    }, [protectAsyncFunction]),

    // Protected data export
    exportData: useCallback((exportFunction, options = {}) => {
      return protectAsyncFunction(exportFunction, {
        message: 'Please authenticate to export data',
        ...options
      });
    }, [protectAsyncFunction]),

    // Protected sensitive operations
    performSensitiveOperation: useCallback((operation, options = {}) => {
      return protectAsyncFunction(operation, {
        message: 'Please authenticate to perform this sensitive operation',
        ...options
      });
    }, [protectAsyncFunction])
  };

  return {
    // Core functions
    executeProtectedAction,
    navigateProtected,
    protectFunction,
    protectAsyncFunction,
    
    // WebAuthn state and controls
    ...webauthn,
    
    // Common shortcuts
    ...shortcuts
  };
};

export default useProtectedAction;
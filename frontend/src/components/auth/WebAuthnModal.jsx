import React from 'react';
import { Shield, Key, X } from 'lucide-react';

/**
 * WebAuthn Authentication Modal Component
 * Displays authentication prompt with loading states and error handling
 */
const WebAuthnModal = ({
  isOpen,
  isAuthenticating,
  error,
  message = 'Please authenticate with your passkey to continue',
  onAuthenticate,
  onCancel,
  onClearError
}) => {
  if (!isOpen) return null;

  const handleAuthenticate = () => {
    if (error) {
      onClearError?.();
    }
    onAuthenticate?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Authentication Required
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isAuthenticating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 rounded-full ${
              error 
                ? 'bg-red-100' 
                : isAuthenticating 
                  ? 'bg-blue-100 animate-pulse' 
                  : 'bg-green-100'
            }`}>
              <Key className={`h-8 w-8 ${
                error 
                  ? 'text-red-600' 
                  : isAuthenticating 
                    ? 'text-green-700' 
                    : 'text-green-600'
              }`} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {message}
            </p>

            {/* Status Messages */}
            {isAuthenticating && (
              <div className="mb-4">
                <div className="inline-flex items-center px-3 py-2 bg-green-50 rounded-full text-green-700 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  Waiting for authentication...
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {!isAuthenticating && !error && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Touch your security key, use your fingerprint, or complete the authentication process to continue.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isAuthenticating}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAuthenticating ? (
              <>
                Authenticating...
              </>
            ) : error ? (
              'Retry Authentication'
            ) : (
              'Authenticate'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            This action requires additional security verification using your registered passkey or biometric authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebAuthnModal;
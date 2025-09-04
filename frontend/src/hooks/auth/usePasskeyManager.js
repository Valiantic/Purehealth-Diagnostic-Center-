import { useState, useEffect } from 'react';
import { webauthnAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Simple readiness check function
const checkBasicReadiness = async () => {
  const issues = [];
  
  if (!window.PublicKeyCredential) {
    issues.push('WebAuthn not supported');
  }
  
  if (!navigator.credentials?.create) {
    issues.push('Credentials API not available');
  }
  
  if (!window.isSecureContext && window.location.protocol !== 'http:') {
    issues.push('Secure context required');
  }
  
  try {
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        issues.push('Platform authenticator not available');
      }
    }
  } catch (err) {
    // Not critical
  }
  
  return issues;
};

const usePasskeyManager = (userId) => {
  const [isLoading, setIsLoading] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add' or 'change'
  const [selectedPasskey, setSelectedPasskey] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch user's passkeys
  const fetchPasskeys = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await webauthnAPI.getUserPasskeys(userId);
      if (response.data && response.data.success) {
        setPasskeys(response.data.passkeys || []);
      }
    } catch (error) {
      console.error('Error fetching passkeys:', error);
      toast.error('Failed to load passkeys');
    } finally {
      setIsLoading(false);
    }
  };

  // Load passkeys when userId changes
  useEffect(() => {
    fetchPasskeys();
  }, [userId]);

  // Open modal for adding new passkey
  const openAddPasskeyModal = () => {
    setModalType('add');
    setSelectedPasskey(null);
    setIsModalOpen(true);
  };

  // Open modal for changing existing passkey
  const openChangePasskeyModal = (passkey) => {
    setModalType('change');
    setSelectedPasskey(passkey);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setSelectedPasskey(null);
  };

  // Add new passkey
  const addPasskey = async (isPrimary = false) => {
    if (!userId) {
      toast.error('User ID is required');
      return false;
    }

    // Run basic readiness check first
    const readinessIssues = await checkBasicReadiness();
    if (readinessIssues.length > 0) {
      const issueText = readinessIssues.join(', ');
      toast.error(`Device not ready for passkeys: ${issueText}. Please check the troubleshooting guide.`, {
        autoClose: 8000
      });
      return false;
    }

    setIsRegistering(true);
    
    // Show user guidance toast
    toast.info('🔐 Get ready! Your browser will prompt you to create a passkey. Please approve it when asked.', {
      autoClose: 5000
    });

    try {
      // Step 1: Get registration options
      console.log('Getting registration options for user:', userId);
      const optionsResponse = await webauthnAPI.getRegistrationOptions(userId, isPrimary);
      if (!optionsResponse.data || !optionsResponse.data.success) {
        throw new Error(optionsResponse.data?.message || 'Failed to get registration options');
      }

      const options = optionsResponse.data.options;
      console.log('Registration options received:', options);

      // Step 2: Convert options to proper format with better error handling
      let publicKeyCredentialCreationOptions;
      try {
        publicKeyCredentialCreationOptions = {
          ...options,
          challenge: new Uint8Array(options.challenge),
          user: {
            ...options.user,
            id: new Uint8Array(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map(cred => ({
            ...cred,
            id: new Uint8Array(cred.id)
          })) || [],
          timeout: 120000, // Increased to 2 minutes
          attestation: 'none'
        };
      } catch (conversionError) {
        console.error('Error converting options:', conversionError);
        throw new Error('Invalid registration options received from server');
      }

      console.log('Converted options:', publicKeyCredentialCreationOptions);

      // Step 3: Create credentials with comprehensive error handling
      let credential;
      try {
        console.log('Starting credential creation...');
        
        // Show immediate guidance
        toast.info('🎯 Creating passkey now... Please authenticate when prompted!', {
          autoClose: 3000
        });

        credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });

        console.log('Credential created successfully:', credential);
      } catch (credentialError) {
        console.error('Credential creation error:', credentialError);
        console.error('Error details:', {
          name: credentialError.name,
          message: credentialError.message,
          code: credentialError.code,
          stack: credentialError.stack
        });
        
        // Handle specific WebAuthn errors with detailed guidance
        if (credentialError.name === 'NotAllowedError') {
          throw new Error(`Passkey creation was cancelled or denied. This usually happens when:

• You clicked "Cancel" on the authentication prompt
• Your device doesn't support the requested authentication method
• You took too long to respond to the prompt
• Another authentication dialog is already open

💡 Tips to fix this:
• Try again and quickly approve the authentication prompt
• Make sure no other authentication dialogs are open
• On Windows: Ensure Windows Hello is set up
• On Mac: Make sure Touch ID is working
• On mobile: Enable biometric authentication

Please try again and be ready to authenticate immediately.`);
        } else if (credentialError.name === 'InvalidStateError') {
          throw new Error('A passkey for this account already exists on this device. Try using a different device or delete the existing passkey first.');
        } else if (credentialError.name === 'NotSupportedError') {
          throw new Error(`Your browser or device doesn't support the required authentication method.

💡 Try this:
• Use Chrome, Edge, Safari, or Firefox (latest versions)
• Update your browser to the latest version
• Try a different device
• Contact support if you need help`);
        } else if (credentialError.name === 'SecurityError') {
          throw new Error(`Security requirements not met.

💡 Please check:
• You are on a secure connection (HTTPS)
• Your device has a screen lock enabled (PIN, password, biometrics)
• You are using a supported browser
• No security software is blocking the request`);
        } else if (credentialError.name === 'AbortError') {
          throw new Error('Passkey creation was aborted. This can happen if another authentication request is active. Please wait a moment and try again.');
        } else if (credentialError.name === 'ConstraintError') {
          throw new Error('Your device does not support the required authentication constraints. Try using a different authentication method or device.');
        } else if (credentialError.name === 'UnknownError') {
          throw new Error('An unknown error occurred during passkey creation. Please try again or contact support if the issue persists.');
        } else {
          throw new Error(`Passkey creation failed: ${credentialError.message || 'Unknown error'}

Please try again or contact support if the issue persists.`);
        }
      }

      if (!credential) {
        throw new Error('Failed to create passkey - no credential returned from browser');
      }

      console.log('Preparing response for verification...');

      // Step 4: Prepare the response for verification with better error handling
      let response;
      try {
        response = {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            transports: credential.response.getTransports ? credential.response.getTransports() : []
          },
          type: credential.type
        };
      } catch (responseError) {
        console.error('Error preparing response:', responseError);
        throw new Error('Failed to prepare passkey data for verification');
      }

      console.log('Verifying registration...');

      // Step 5: Verify registration
      const verifyResponse = await webauthnAPI.verifyRegistration(userId, response, isPrimary);
      if (!verifyResponse.data || !verifyResponse.data.success) {
        const errorMsg = verifyResponse.data?.message || 'Failed to verify passkey registration';
        console.error('Verification failed:', verifyResponse.data);
        throw new Error(`Server verification failed: ${errorMsg}`);
      }

      console.log('Passkey registration successful!');
      toast.success(`🎉 ${isPrimary ? 'Primary' : 'Backup'} passkey added successfully!`);
      await fetchPasskeys(); // Refresh the list
      closeModal();
      return true;

    } catch (error) {
      console.error('Error adding passkey:', error);
      
      // Display the error message (it's already formatted with helpful info)
      toast.error(error.message, { 
        autoClose: 12000, // Longer display for detailed messages
        style: {
          whiteSpace: 'pre-line' // Preserve line breaks
        }
      });
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // Delete passkey
  const deletePasskey = async (passkeyId) => {
    if (!passkeyId) return false;

    try {
      const response = await webauthnAPI.deletePasskey(passkeyId);
      if (response.data && response.data.success) {
        toast.success('Passkey deleted successfully');
        await fetchPasskeys(); // Refresh the list
        return true;
      } else {
        throw new Error('Failed to delete passkey');
      }
    } catch (error) {
      console.error('Error deleting passkey:', error);
      toast.error(`Failed to delete passkey: ${error.message}`);
      return false;
    }
  };

  // Set passkey as primary
  const setPrimaryPasskey = async (passkeyId) => {
    if (!passkeyId) return false;

    try {
      const response = await webauthnAPI.setPrimaryPasskey(passkeyId);
      if (response.data && response.data.success) {
        toast.success('Primary passkey updated successfully');
        await fetchPasskeys(); // Refresh the list
        return true;
      } else {
        throw new Error('Failed to update primary passkey');
      }
    } catch (error) {
      console.error('Error setting primary passkey:', error);
      toast.error(`Failed to update primary passkey: ${error.message}`);
      return false;
    }
  };

  return {
    // State
    isLoading,
    passkeys,
    isModalOpen,
    modalType,
    selectedPasskey,
    isRegistering,
    
    // Actions
    fetchPasskeys,
    openAddPasskeyModal,
    openChangePasskeyModal,
    closeModal,
    addPasskey,
    deletePasskey,
    setPrimaryPasskey
  };
};

export default usePasskeyManager;

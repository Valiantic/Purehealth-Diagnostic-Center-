import { useState, useEffect } from 'react';
import { webauthnAPI } from '../../services/api';
import { toast } from 'react-toastify';

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

  // Helper function to convert ArrayBuffer to base64url
  const arrayBufferToBase64url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  // Helper function to convert base64url string to Uint8Array
  const base64urlToUint8Array = (base64url) => {
    // Handle already converted Uint8Array or ArrayBuffer
    if (base64url instanceof Uint8Array) {
      return base64url;
    }
    if (base64url instanceof ArrayBuffer) {
      return new Uint8Array(base64url);
    }

    // Handle array of numbers (from JSON serialization)
    if (Array.isArray(base64url)) {
      return new Uint8Array(base64url);
    }

    // Handle object with numeric keys (another form of array from JSON)
    if (typeof base64url === 'object' && base64url !== null) {
      const keys = Object.keys(base64url);
      if (keys.length > 0 && keys.every(k => !isNaN(k))) {
        const arr = new Uint8Array(keys.length);
        keys.forEach(k => arr[k] = base64url[k]);
        return arr;
      }
    }

    // Handle base64url string
    if (typeof base64url === 'string') {
      try {
        // Convert base64url string to regular base64
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padLength = (4 - (base64.length % 4)) % 4;
        const paddedBase64 = base64 + '='.repeat(padLength);


        // Decode base64 to binary string
        const binary = atob(paddedBase64);
        // Convert binary string to Uint8Array
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      } catch (error) {
        console.error('[base64urlToUint8Array] Error decoding base64url string:', error);
        console.error('[base64urlToUint8Array] Input value:', base64url);
        console.error('[base64urlToUint8Array] Input type:', typeof base64url);
        console.error('[base64urlToUint8Array] Input length:', base64url?.length);
        throw new Error(`Failed to decode base64url string: ${error.message}`);
      }
    }

    throw new Error(`Unsupported input type for base64urlToUint8Array: ${typeof base64url}`);
  };

  // Helper function to convert string (like user ID) to Uint8Array
  // This is for plain strings, NOT base64url encoded data
  const stringToUint8Array = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  };

  // Add new passkey
  const addPasskey = async (isPrimary = false) => {
    if (!userId) {
      toast.error('User ID is required');
      return false;
    }

    setIsRegistering(true);
    try {
      // Step 1: Get registration options
      const optionsResponse = await webauthnAPI.getRegistrationOptions(userId, isPrimary);
      if (!optionsResponse.data || !optionsResponse.data.success) {
        throw new Error('Failed to get registration options');
      }

      const options = optionsResponse.data.options;


      // Step 2: Create credentials using WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64urlToUint8Array(options.challenge),
          user: {
            ...options.user,
            // user.id is a plain string (like "1"), not base64url encoded
            id: stringToUint8Array(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map(cred => ({
            ...cred,
            // credential IDs are base64url encoded
            id: base64urlToUint8Array(cred.id)
          })) || []
        }
      });

      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      // Step 3: Prepare the response for verification with proper base64url encoding
      const rawIdBase64url = arrayBufferToBase64url(credential.rawId);

      const response = {
        id: rawIdBase64url, // Use our encoded version to ensure consistency
        rawId: rawIdBase64url,
        response: {
          attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          transports: credential.response.getTransports ? credential.response.getTransports() : []
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults()
      };

      // Step 4: Verify registration
      const verifyResponse = await webauthnAPI.verifyRegistration(userId, response, isPrimary);
      if (!verifyResponse.data || !verifyResponse.data.success) {
        throw new Error('Failed to verify passkey registration');
      }

      toast.success('Passkey added successfully');
      await fetchPasskeys(); // Refresh the list
      closeModal();
      return true;
    } catch (error) {
      console.error('Error adding passkey:', error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Passkey registration was cancelled or timed out. Please try again.' 
        : `Failed to add passkey: ${error.message}`;
      toast.error(errorMessage);
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

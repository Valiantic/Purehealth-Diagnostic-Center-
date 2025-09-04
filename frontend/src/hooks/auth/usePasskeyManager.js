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
          challenge: new Uint8Array(options.challenge),
          user: {
            ...options.user,
            id: new Uint8Array(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map(cred => ({
            ...cred,
            id: new Uint8Array(cred.id)
          }))
        }
      });

      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      // Step 3: Prepare the response for verification
      const response = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
        },
        type: credential.type
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
        ? 'Passkey registration was cancelled or failed' 
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

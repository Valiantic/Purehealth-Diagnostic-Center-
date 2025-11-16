import React from 'react';
import { X, Key, Plus, Trash2, Shield, ShieldCheck } from 'lucide-react';

const PasskeyModal = ({
  isOpen,
  onClose,
  modalType,
  passkeys,
  selectedPasskey,
  isRegistering,
  onAddPasskey,
  onDeletePasskey,
  onSetPrimaryPasskey
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'singledevice':
        return '📱';
      case 'multidevice':
        return '🔐';
      default:
        return '🔑';
    }
  };

  const handleAddPrimary = () => onAddPasskey(true);
  const handleAddBackup = () => onAddPasskey(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Key className="w-6 h-6 text-green-800 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {modalType === 'add' ? 'Add New Passkey' : 'Manage Passkeys'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {modalType === 'add' ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Add a New Passkey
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose to add a primary passkey or a backup passkey to your account.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
                  <div className="flex items-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Primary Passkey</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Your main authentication method. This will replace your current primary passkey.
                  </p>
                  <button
                    onClick={handleAddPrimary}
                    disabled={isRegistering}
                    className="w-full bg-green-800 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRegistering ? 'Creating...' : 'Add Primary Passkey'}
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <div className="flex items-center mb-3">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Backup Passkey</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    An additional authentication method for backup access to your account.
                  </p>
                  <button
                    onClick={handleAddBackup}
                    disabled={isRegistering}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRegistering ? 'Creating...' : 'Add Backup Passkey'}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Adding a new primary passkey will replace your current primary passkey</li>
                  <li>• You can have multiple backup passkeys for redundancy</li>
                  <li>• Make sure your device supports passkeys before proceeding</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Your Passkeys ({passkeys.length})
                </h3>
                
                {passkeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No passkeys found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className={`border rounded-lg p-4 ${
                          passkey.isPrimary ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {getDeviceIcon(passkey.credentialDeviceType)}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">
                                  {passkey.isPrimary ? 'Primary' : 'Backup'} Passkey
                                </span>
                                {passkey.isPrimary && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Primary
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                Device: {passkey.credentialDeviceType}
                              </p>
                              <p className="text-sm text-gray-500">
                                Created: {formatDate(passkey.createdAt)}
                              </p>
                              {passkey.transports && passkey.transports.length > 0 && (
                                <p className="text-sm text-gray-500">
                                  Transports: {passkey.transports.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!passkey.isPrimary && (
                              <button
                                onClick={() => onSetPrimaryPasskey(passkey.id)}
                                className="text-green-600 hover:text-green-800 p-2 rounded-md hover:bg-green-100 transition-colors"
                                title="Set as primary"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => onDeletePasskey(passkey.id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 transition-colors"
                              title="Delete passkey"
                              disabled={passkey.isPrimary && passkeys.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Passkey:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => onAddPasskey(true)}
                      disabled={isRegistering}
                      className="bg-green-800 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {isRegistering ? 'Adding...' : 'Add Primary'}
                    </button>
                    <button
                      onClick={() => onAddPasskey(false)}
                      disabled={isRegistering}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isRegistering ? 'Adding...' : 'Add Backup'}
                    </button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">
                    <strong>Tip:</strong> Adding a primary passkey will replace your current primary. Use backup passkeys for additional devices.
                  </p>
                </div>
              </div>

              {passkeys.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Passkey Management Tips:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• You can add multiple passkeys on different devices/authenticators</li>
                    <li>• Keep at least one backup passkey for account recovery</li>
                    <li>• Primary passkey is used for main authentication</li>
                    <li>• You cannot delete your only remaining passkey</li>
                    <li>• Deleted passkeys cannot be recovered</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {modalType === 'add' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasskeyModal;

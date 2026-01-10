import React, { useState, useEffect } from 'react';
import { X, Shield } from 'lucide-react';
import apiClient from '../services/api';
import { startAuthentication } from '@simplewebauthn/browser';

const AdminVerificationModal = ({
    isOpen,
    onClose,
    onVerify,
    currentUser,
    actionDescription = "this action"
}) => {
    const [adminEmail, setAdminEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Enter email, 2: WebAuthn prompt

    // Auto-fill email if user is admin, clear for receptionist
    useEffect(() => {
        if (isOpen) {
            if (currentUser?.role === 'admin') {
                // Admin is logged in - use their email
                setAdminEmail(currentUser.email);
            } else {
                // Non-admin user (receptionist) - clear email field so they MUST enter admin's email
                setAdminEmail('');
            }
            // Reset state when modal opens
            setError('');
            setStep(1);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleEmailSubmit = async (e, prefilledEmail = null) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const emailToUse = prefilledEmail || adminEmail;

        if (!emailToUse) {
            setError('Please enter an email address');
            return;
        }

        // If receptionist is trying to use their own email, prevent it
        if (currentUser?.role !== 'admin' && emailToUse === currentUser?.email) {
            setError('You cannot use your own email. Please enter an admin\'s email address.');
            return;
        }

        setError('');
        setIsVerifying(true);

        try {
            // Step 1: Get authentication options (challenge) for the admin email
            const optionsResponse = await apiClient.post('/webauthn/authentication/options', {
                email: emailToUse
            });

            if (!optionsResponse.data.success) {
                throw new Error(optionsResponse.data.message || 'Failed to generate authentication options');
            }

            const { options, userId } = optionsResponse.data;

            // Step 2: Trigger WebAuthn authentication
            setStep(2);
            const authResponse = await startAuthentication(options);

            // Step 3: Verify the WebAuthn response
            const verifyResponse = await apiClient.post('/webauthn/authentication/verify', {
                userId: userId,
                response: authResponse
            });

            if (!verifyResponse.data.success) {
                throw new Error('Authentication failed');
            }

            // Step 4: Verify that the authenticated user is an admin
            const roleVerifyResponse = await apiClient.post('/users/verify-admin', {
                userId: userId
            });

            if (roleVerifyResponse.data.success && roleVerifyResponse.data.isAdmin) {
                // Success! Admin authenticated
                onVerify(true, roleVerifyResponse.data.user);
                onClose();
            } else {
                setError('The authenticated user is not an admin. Admin privileges required.');
                setStep(1);
            }

        } catch (err) {
            console.error('Admin verification error:', err);

            // Handle specific error cases
            if (err.response?.status === 404 || err.response?.status === 400) {
                setError('Email address not found. Please enter a valid admin email.');
            } else if (err.name === 'NotAllowedError' || err.message.includes('timed out') || err.message.includes('not allowed')) {
                setError('Authentication cancelled.');
            } else if (err.message) {
                setError(err.message);
            } else {
                setError(err.response?.data?.message || 'Failed to verify admin credentials');
            }

            setStep(1);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleCancel = () => {
        setAdminEmail('');
        setError('');
        setStep(1);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">
                        🔐 Admin Verification Required
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isVerifying}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleEmailSubmit} className="p-6">
                    {step === 1 ? (
                        <>
                            <div className="mb-4">
                                <p className="text-gray-700 mb-2">
                                    To perform {actionDescription}, admin authentication is required.
                                </p>
                                {currentUser?.role !== 'admin' ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                                        <p className="text-sm text-yellow-800 font-semibold">
                                            ⚠ You are logged in as a <strong>{currentUser?.role}</strong>.
                                        </p>
                                        <p className="text-sm text-yellow-800 mt-1">
                                            You MUST enter an <strong>admin's email address</strong> (not your own) and use their FIDO2/WebAuthn security key to authenticate.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                                        <p className="text-sm text-blue-800">
                                            ℹ️ Re-authentication required. Please verify your identity with your FIDO2/WebAuthn security key.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Email Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder={currentUser?.role === 'admin' ? currentUser.email : 'Enter admin email'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                    disabled={isVerifying}
                                />
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
                            <p className="text-lg font-medium text-gray-800 mb-2">
                                Authenticating...
                            </p>
                            <p className="text-sm text-gray-600">
                                Please use your FIDO2/WebAuthn security key to authenticate
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            disabled={isVerifying}
                        >
                            Cancel
                        </button>
                        {step === 1 && (
                            <button
                                type="submit"
                                className={`px-4 py-2 text-white rounded transition-colors flex items-center gap-2 ${isVerifying || !adminEmail
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                disabled={isVerifying || !adminEmail}
                            >
                                {isVerifying ? (
                                    'Verifying...'
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Authenticate
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminVerificationModal;

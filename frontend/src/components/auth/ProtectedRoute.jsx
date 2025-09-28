import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/auth/useAuth'
import useWebAuthn from '../../hooks/auth/useWebAuthn'
import WebAuthnModal from './WebAuthnModal'
import Loading from '../transaction/Loading'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Routes that require WebAuthn authentication
const WEBAUTHN_PROTECTED_ROUTES = [
    '/add-transaction',
    '/add-expenses'
];

const ProtectedRoute = ({ 
    component: Component, 
    allowedRoles = [], 
    restrictFromRole, 
    requireWebAuthn = null, 
    ...rest 
}) => {
    const { user, isAuthenticating } = useAuth();
    const location = useLocation();
    const [isWebAuthnAuthenticated, setIsWebAuthnAuthenticated] = useState(false);
    const [isCheckingWebAuthn, setIsCheckingWebAuthn] = useState(false);
    
    const {
        isAuthenticating: isWebAuthnAuthenticating,
        isModalOpen,
        error,
        authenticate,
        cancelAuthentication,
        clearError,
        resetState
    } = useWebAuthn();

    // Determine if current route requires WebAuthn
    const needsWebAuthn = requireWebAuthn !== null 
        ? requireWebAuthn 
        : WEBAUTHN_PROTECTED_ROUTES.includes(location.pathname);

    useEffect(() => {
        if (user && restrictFromRole && user.role === restrictFromRole) {
            toast.error('You do not have permission to access this page', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    }, [user, restrictFromRole]);

    // Handle WebAuthn authentication for protected routes
    useEffect(() => {
        const checkWebAuthnAuth = async () => {
            if (!user?.email || !needsWebAuthn || isAuthenticating) {
                return;
            }

            setIsCheckingWebAuthn(true);
            
            try {
                const success = await authenticate(user.email, { 
                    showToast: false, 
                    openModal: false 
                });
                
                if (success) {
                    setIsWebAuthnAuthenticated(true);
                } else {
                    console.error('WebAuthn authentication failed');
                }
            } catch (error) {
                console.error('WebAuthn route protection failed:', error);
            } finally {
                setIsCheckingWebAuthn(false);
            }
        };

        if (needsWebAuthn && user && !isWebAuthnAuthenticated && !isCheckingWebAuthn) {
            checkWebAuthnAuth();
        }
    }, [user, needsWebAuthn, isWebAuthnAuthenticated, isCheckingWebAuthn, isAuthenticating]);

    const handleWebAuthnCancel = () => {
        cancelAuthentication();
        resetState();
        toast.info('Authentication cancelled');
        return <Navigate to="/transaction" replace />;
    };

    const handleWebAuthnSuccess = () => {
        setIsWebAuthnAuthenticated(true);
        resetState();
        toast.success('Authentication successful');
    };

    if (isAuthenticating) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Loading message="Checking authentication..." />
        </div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (restrictFromRole && user.role === restrictFromRole) {
        return <Navigate to="/dashboard" replace />;
    }

    if (needsWebAuthn && isCheckingWebAuthn) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Loading message="Verifying access permissions..." />
        </div>;
    }

    // Show authentication modal or redirect if WebAuthn required but not authenticated
    if (needsWebAuthn && !isWebAuthnAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                        Additional Authentication Required
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        This page requires additional security verification to access.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => window.history.back()}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => authenticate(user.email, { 
                                showToast: true, 
                                openModal: false 
                            }).then(success => {
                                if (success) handleWebAuthnSuccess();
                            })}
                            disabled={isWebAuthnAuthenticating}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isWebAuthnAuthenticating ? 'Authenticating...' : 'Authenticate'}
                        </button>
                    </div>
                    
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                <WebAuthnModal
                    isOpen={isModalOpen}
                    isAuthenticating={isWebAuthnAuthenticating}
                    error={error}
                    message={`Please authenticate to access ${location.pathname}`}
                    onAuthenticate={() => authenticate(user.email, { 
                        showToast: true, 
                        openModal: false 
                    }).then(success => {
                        if (success) handleWebAuthnSuccess();
                    })}
                    onCancel={handleWebAuthnCancel}
                    onClearError={clearError}
                />
            </div>
        );
    }

    return <Component />;
}

export default ProtectedRoute

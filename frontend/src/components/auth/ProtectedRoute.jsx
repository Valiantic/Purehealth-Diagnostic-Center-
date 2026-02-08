import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/auth/useAuth'
import usePermissions from '../../hooks/auth/usePermissions'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

/**
 * ProtectedRoute component with permission-based access control
 * 
 * Props:
 * - component: Component to render if authorized
 * - requiredPermission: Single permission required (e.g., 'accounts.manage')
 * - requiredAnyPermission: Array of permissions, user needs at least one
 * - restrictFromRole: Legacy support - restrict specific role (deprecated)
 */
const ProtectedRoute = ({
    component: Component,
    requiredPermission,
    requiredAnyPermission,
    restrictFromRole, // Legacy support - will be phased out
    ...rest
}) => {
    const { user, isAuthenticating } = useAuth();
    const { permissions, hasPermission, hasAnyPermission, loading: permissionsLoading } = usePermissions();

    // Check access based on permissions or legacy role restriction
    const hasAccess = React.useMemo(() => {
        if (!user) return false;
        
        // While authentication or permissions are still loading, assume access is allowed
        // This prevents false negatives during initial load
        if (isAuthenticating || permissionsLoading) return true;
        
        // If permissions array is empty and we have a user, wait for permissions to load
        // This handles race conditions during page reload
        if (permissions.length === 0 && user.role !== 'admin') {
            // For non-admin users, if permissions are empty after loading, use fallback logic
            // Check if the route requires a permission - if not, allow access
            if (!requiredPermission && !requiredAnyPermission) return true;
            return false;
        }

        // Permission-based checks (new system)
        if (requiredPermission) {
            // Admin role always has all permissions
            if (user.role === 'admin') return true;
            // Direct check against permissions array for reliability
            return permissions.includes(requiredPermission);
        }

        if (requiredAnyPermission && Array.isArray(requiredAnyPermission)) {
            // Admin role always has all permissions
            if (user.role === 'admin') return true;
            // Direct check against permissions array for reliability
            return requiredAnyPermission.some(perm => permissions.includes(perm));
        }

        // Legacy role-based restriction (backward compatibility)
        if (restrictFromRole && user.role === restrictFromRole) {
            return false;
        }

        // No specific permission required, allow access
        return true;
    }, [user, requiredPermission, requiredAnyPermission, restrictFromRole, permissions, permissionsLoading, isAuthenticating]);

    useEffect(() => {
        // Only show toast if authentication and permissions have finished loading and user doesn't have access
        if (user && !isAuthenticating && !permissionsLoading && !hasAccess) {
            toast.error('You do not have permission to access this page', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                toastId: 'permission-denied' // Prevent duplicate toasts
            });
        }
    }, [user, hasAccess, permissionsLoading, isAuthenticating]);

    // Loading states
    if (isAuthenticating || permissionsLoading) {
        return null;
    }

    // Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // No access
    if (!hasAccess) {
        // Don't redirect to dashboard if we're already trying to access dashboard
        // This prevents infinite redirect loops
        if (window.location.pathname === '/dashboard') {
            // User can't access dashboard, show a basic message or redirect to settings
            return <Navigate to="/settings" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <Component />;
}

export default ProtectedRoute


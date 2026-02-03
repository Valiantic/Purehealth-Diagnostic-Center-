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
 * - requiredPermission: Single permission required (e.g., 'accounts.view')
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
    const { hasPermission, hasAnyPermission, loading: permissionsLoading } = usePermissions();

    // Check access based on permissions or legacy role restriction
    const hasAccess = React.useMemo(() => {
        if (!user) return false;

        // Permission-based checks (new system)
        if (requiredPermission) {
            return hasPermission(requiredPermission);
        }

        if (requiredAnyPermission && Array.isArray(requiredAnyPermission)) {
            return hasAnyPermission(requiredAnyPermission);
        }

        // Legacy role-based restriction (backward compatibility)
        if (restrictFromRole && user.role === restrictFromRole) {
            return false;
        }

        // No specific permission required, allow access
        return true;
    }, [user, requiredPermission, requiredAnyPermission, restrictFromRole, hasPermission, hasAnyPermission]);

    useEffect(() => {
        if (user && !hasAccess) {
            const reason = requiredPermission
                ? `Missing permission: ${requiredPermission}`
                : restrictFromRole
                    ? 'Role restriction'
                    : 'Insufficient permissions';

            toast.error('You do not have permission to access this page', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    }, [user, hasAccess, requiredPermission, restrictFromRole]);

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
        return <Navigate to="/dashboard" replace />;
    }

    return <Component />;
}

export default ProtectedRoute


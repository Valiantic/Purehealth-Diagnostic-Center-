import { useState, useEffect, useCallback, useMemo } from 'react';
import { roleAPI } from '../../services/api';
import useAuth from './useAuth';

/**
 * Custom hook for managing user permissions in the frontend
 * Provides permission checking utilities for UI-level access control
 */
const usePermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [roleInfo, setRoleInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user permissions on mount or when user changes
    const fetchPermissions = useCallback(async () => {
        if (!user?.userId) {
            setPermissions([]);
            setRoleInfo(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await roleAPI.getUserPermissions(user.userId);

            if (response.data?.success) {
                const apiPermissions = response.data.permissions || [];
                
                // If API returns empty permissions but user has a role, use fallback permissions
                // This handles cases where RBAC tables are not fully set up
                if (apiPermissions.length === 0) {
                    const fallbackPermissions = getFallbackPermissions(user.role);
                    setPermissions(fallbackPermissions);
                    setRoleInfo({
                        roleId: response.data.roleId,
                        roleName: response.data.roleName || user.role,
                        roleDisplayName: response.data.roleDisplayName || (user.role === 'admin' ? 'Administrator' : 'Receptionist')
                    });
                } else {
                    setPermissions(apiPermissions);
                    setRoleInfo({
                        roleId: response.data.roleId,
                        roleName: response.data.roleName,
                        roleDisplayName: response.data.roleDisplayName
                    });
                }
            } else {
                // Fallback for users without roleId (legacy support)
                // Admin gets all permissions, receptionist gets standard permissions
                const fallbackPermissions = getFallbackPermissions(user.role);
                setPermissions(fallbackPermissions);
                setRoleInfo({
                    roleId: null,
                    roleName: user.role,
                    roleDisplayName: user.role === 'admin' ? 'Administrator' : 'Receptionist'
                });
            }
        } catch (err) {
            console.error('Error fetching permissions:', err);
            // Fallback on error
            const fallbackPermissions = getFallbackPermissions(user.role);
            setPermissions(fallbackPermissions);
            setRoleInfo({
                roleId: null,
                roleName: user.role,
                roleDisplayName: user.role === 'admin' ? 'Administrator' : 'Receptionist'
            });
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.userId, user?.role]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    /**
     * Check if user has a specific permission
     * @param {string} permissionKey - Permission key to check
     * @returns {boolean}
     */
    const hasPermission = useCallback((permissionKey) => {
        if (!permissionKey) return false;

        // Admin role always has all permissions (fallback)
        if (user?.role === 'admin' && permissions.length === 0) return true;

        return permissions.includes(permissionKey);
    }, [permissions, user?.role]);

    /**
     * Check if user has any of the specified permissions
     * @param {string[]} permissionKeys - Array of permission keys
     * @returns {boolean}
     */
    const hasAnyPermission = useCallback((permissionKeys) => {
        if (!permissionKeys || !Array.isArray(permissionKeys)) return false;

        // Admin role always has all permissions (fallback)
        if (user?.role === 'admin' && permissions.length === 0) return true;

        return permissionKeys.some(key => permissions.includes(key));
    }, [permissions, user?.role]);

    /**
     * Check if user has all of the specified permissions
     * @param {string[]} permissionKeys - Array of permission keys
     * @returns {boolean}
     */
    const hasAllPermissions = useCallback((permissionKeys) => {
        if (!permissionKeys || !Array.isArray(permissionKeys)) return false;

        // Admin role always has all permissions (fallback)
        if (user?.role === 'admin' && permissions.length === 0) return true;

        return permissionKeys.every(key => permissions.includes(key));
    }, [permissions, user?.role]);

    /**
     * Check if user is an admin
     * @returns {boolean}
     */
    const isAdmin = useMemo(() => {
        return user?.role === 'admin' || roleInfo?.roleName === 'admin';
    }, [user?.role, roleInfo?.roleName]);

    /**
     * Get permissions grouped by category
     * @returns {Object}
     */
    const permissionsByCategory = useMemo(() => {
        const grouped = {};
        permissions.forEach(perm => {
            const [category] = perm.split('.');
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(perm);
        });
        return grouped;
    }, [permissions]);

    return {
        permissions,
        roleInfo,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        permissionsByCategory,
        refetchPermissions: fetchPermissions
    };
};

/**
 * Get fallback permissions for legacy role-based system
 */
function getFallbackPermissions(role) {
    const adminPermissions = [
        'dashboard.view',
        'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.cancel', 'transactions.refund', 'transactions.export',
        'collectible.view', 'collectible.create', 'collectible.edit', 'collectible.export',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.archive', 'expenses.export',
        'referrals.view', 'referrals.manage', 'referrals.export',
        'reports.monthly', 'reports.export',
        'accounts.view', 'accounts.create', 'accounts.edit', 'accounts.archive',
        'roles.view', 'roles.manage',
        'settings.view', 'settings.edit',
        'activitylog.view',
        'departments.view', 'departments.manage',
        'tests.view', 'tests.manage'
    ];

    const receptionistPermissions = [
        'dashboard.view',
        'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.cancel', 'transactions.export',
        'collectible.view', 'collectible.create', 'collectible.edit', 'collectible.export',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.export',
        'referrals.view', 'referrals.export',
        'reports.monthly', 'reports.export',
        'settings.view'
    ];

    if (role === 'admin') {
        return adminPermissions;
    }
    return receptionistPermissions;
}

export default usePermissions;

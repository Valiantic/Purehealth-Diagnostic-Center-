import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { roleAPI } from '../../services/api';
import useAuth from './useAuth';

/**
 * Custom hook for managing user permissions in the frontend
 * Provides permission checking utilities for UI-level access control
 */
const usePermissions = () => {
    const { user, isAuthenticating } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [roleInfo, setRoleInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user permissions on mount or when user changes
    const fetchPermissions = useCallback(async () => {
        // Keep loading true while authentication is in progress
        if (isAuthenticating) {
            setLoading(true);
            return;
        }

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
                const hasRoleAssigned = !!response.data.roleId;

                // If the user has a role assigned via RBAC, use the API permissions directly
                // Even if empty - this means the role intentionally has no permissions
                if (hasRoleAssigned) {
                    setPermissions(apiPermissions);
                    setRoleInfo({
                        roleId: response.data.roleId,
                        roleName: response.data.roleName,
                        roleDisplayName: response.data.roleDisplayName
                    });
                } else {
                    // User has no roleId (legacy user pre-RBAC) — use fallback permissions
                    const fallbackPermissions = getFallbackPermissions(user.role);
                    setPermissions(fallbackPermissions);
                    setRoleInfo({
                        roleId: null,
                        roleName: user.role,
                        roleDisplayName: user.role === 'admin' ? 'Administrator' : 'Receptionist'
                    });
                }
            } else {
                // API returned non-success — use fallback for backward compatibility
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
            // On network/API error, use fallback to prevent lockout
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
    }, [user?.userId, user?.role, isAuthenticating]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    // Listen for real-time permission updates via socket
    useEffect(() => {
        if (!user?.userId) return;

        const serverUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) || 'http://localhost:5000';
        const socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 3,
        });

        socket.on('connect', () => {
            socket.emit('join', 'dashboard');
        });

        socket.on('permissions-updated', () => {
            // Refetch permissions whenever any role is updated
            fetchPermissions();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.userId, fetchPermissions]);

    /**
     * Check if user has a specific permission
     * @param {string} permissionKey - Permission key to check
     * @returns {boolean}
     */
    const hasPermission = useCallback((permissionKey) => {
        if (!permissionKey) return false;

        // Admin role always has all permissions
        if (user?.role === 'admin') return true;

        return permissions.includes(permissionKey);
    }, [permissions, user?.role]);

    /**
     * Check if user has any of the specified permissions
     * @param {string[]} permissionKeys - Array of permission keys
     * @returns {boolean}
     */
    const hasAnyPermission = useCallback((permissionKeys) => {
        if (!permissionKeys || !Array.isArray(permissionKeys)) return false;

        // Admin role always has all permissions
        if (user?.role === 'admin') return true;

        return permissionKeys.some(key => permissions.includes(key));
    }, [permissions, user?.role]);

    /**
     * Check if user has all of the specified permissions
     * @param {string[]} permissionKeys - Array of permission keys
     * @returns {boolean}
     */
    const hasAllPermissions = useCallback((permissionKeys) => {
        if (!permissionKeys || !Array.isArray(permissionKeys)) return false;

        // Admin role always has all permissions
        if (user?.role === 'admin') return true;

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
        'collectible.view', 'collectible.create', 'collectible.edit',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.export',
        'referrals.view', 'referrals.manage', 'referrals.export',
        'accounts.manage',
        'roles.manage',
        'activitylog.view',
        'departments.manage',
        'tests.manage'
    ];

    const receptionistPermissions = [
        'dashboard.view',
        'transactions.view', 'transactions.create', 'transactions.edit', 'transactions.cancel', 'transactions.export',
        'collectible.view', 'collectible.create', 'collectible.edit',
        'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.export',
        'referrals.view', 'referrals.export'
    ];

    if (role === 'admin') {
        return adminPermissions;
    }
    return receptionistPermissions;
}

export default usePermissions;

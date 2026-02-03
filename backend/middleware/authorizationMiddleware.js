const { Role, Permission, RolePermission } = require('../models');
const { logActivity } = require('../utils/activityLogger');

/**
 * Check if a user has a specific permission
 * @param {number} userId - User ID
 * @param {string} permissionKey - Permission key to check (e.g., 'transactions.view')
 * @returns {Promise<boolean>}
 */
async function hasPermission(roleId, permissionKey) {
    if (!roleId || !permissionKey) return false;

    try {
        const role = await Role.findByPk(roleId, {
            include: [{
                model: Permission,
                where: { permissionKey },
                required: false
            }]
        });

        if (!role) return false;

        // Check if the role has the permission
        return role.Permissions && role.Permissions.length > 0;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Get all permissions for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<string[]>} - Array of permission keys
 */
async function getRolePermissions(roleId) {
    if (!roleId) return [];

    try {
        const role = await Role.findByPk(roleId, {
            include: [{
                model: Permission,
                through: { attributes: [] }
            }]
        });

        if (!role || !role.Permissions) return [];
        return role.Permissions.map(p => p.permissionKey);
    } catch (error) {
        console.error('Error getting role permissions:', error);
        return [];
    }
}

/**
 * Middleware to require a specific permission
 * @param {string} permissionKey - Required permission key
 */
function requirePermission(permissionKey) {
    return async (req, res, next) => {
        try {
            // Get user from request (should be set by auth middleware)
            const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
            const roleId = req.body.roleId || req.query.roleId || req.headers['x-role-id'];

            if (!roleId) {
                // Log unauthorized access attempt
                await logUnauthorizedAccess(userId, permissionKey, req.path);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: No role assigned'
                });
            }

            const permitted = await hasPermission(roleId, permissionKey);

            if (!permitted) {
                // Log unauthorized access attempt
                await logUnauthorizedAccess(userId, permissionKey, req.path);
                return res.status(403).json({
                    success: false,
                    message: `Access denied: Missing permission '${permissionKey}'`
                });
            }

            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
}

/**
 * Middleware to require any of the specified permissions
 * @param {string[]} permissionKeys - Array of permission keys (any one required)
 */
function requireAnyPermission(permissionKeys) {
    return async (req, res, next) => {
        try {
            const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
            const roleId = req.body.roleId || req.query.roleId || req.headers['x-role-id'];

            if (!roleId) {
                await logUnauthorizedAccess(userId, permissionKeys.join(','), req.path);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: No role assigned'
                });
            }

            const rolePermissions = await getRolePermissions(roleId);
            const hasAny = permissionKeys.some(key => rolePermissions.includes(key));

            if (!hasAny) {
                await logUnauthorizedAccess(userId, permissionKeys.join(','), req.path);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
}

/**
 * Middleware to require all specified permissions
 * @param {string[]} permissionKeys - Array of permission keys (all required)
 */
function requireAllPermissions(permissionKeys) {
    return async (req, res, next) => {
        try {
            const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
            const roleId = req.body.roleId || req.query.roleId || req.headers['x-role-id'];

            if (!roleId) {
                await logUnauthorizedAccess(userId, permissionKeys.join(','), req.path);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: No role assigned'
                });
            }

            const rolePermissions = await getRolePermissions(roleId);
            const hasAll = permissionKeys.every(key => rolePermissions.includes(key));

            if (!hasAll) {
                await logUnauthorizedAccess(userId, permissionKeys.join(','), req.path);
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
}

/**
 * Log unauthorized access attempts for audit
 */
async function logUnauthorizedAccess(userId, attemptedPermission, endpoint) {
    try {
        await logActivity({
            userId: userId || null,
            action: 'UNAUTHORIZED_ACCESS',
            resourceType: 'Security',
            resourceId: null,
            details: JSON.stringify({
                attemptedPermission,
                endpoint,
                timestamp: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Failed to log unauthorized access:', error);
    }
}

module.exports = {
    hasPermission,
    getRolePermissions,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    logUnauthorizedAccess
};

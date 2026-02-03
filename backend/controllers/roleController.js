const { Role, Permission, RolePermission, User, sequelize } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

/**
 * Get all roles with their permissions
 */
async function getAllRoles(req, res) {
    try {
        const roles = await Role.findAll({
            where: { status: 'active' },
            include: [{
                model: Permission,
                through: { attributes: [] },
                attributes: ['permissionId', 'permissionKey', 'displayName', 'category']
            }],
            order: [['isSystem', 'DESC'], ['roleName', 'ASC']]
        });

        return res.json({
            success: true,
            roles: roles.map(role => ({
                roleId: role.roleId,
                roleName: role.roleName,
                displayName: role.displayName,
                description: role.description,
                isSystem: role.isSystem,
                status: role.status,
                permissions: role.Permissions || [],
                createdAt: role.createdAt,
                updatedAt: role.updatedAt
            }))
        });
    } catch (error) {
        console.error('Error getting roles:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch roles',
            error: error.message
        });
    }
}

/**
 * Get a single role by ID with permissions
 */
async function getRoleById(req, res) {
    try {
        const { roleId } = req.params;

        const role = await Role.findByPk(roleId, {
            include: [{
                model: Permission,
                through: { attributes: [] }
            }]
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        return res.json({
            success: true,
            role: {
                roleId: role.roleId,
                roleName: role.roleName,
                displayName: role.displayName,
                description: role.description,
                isSystem: role.isSystem,
                status: role.status,
                permissions: role.Permissions || [],
                createdAt: role.createdAt,
                updatedAt: role.updatedAt
            }
        });
    } catch (error) {
        console.error('Error getting role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch role',
            error: error.message
        });
    }
}

/**
 * Create a new role
 */
async function createRole(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const { roleName, displayName, description, permissionIds, userId } = req.body;

        // Validate required fields
        if (!roleName || !displayName) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Role name and display name are required'
            });
        }

        // Check for duplicate role name
        const existingRole = await Role.findOne({
            where: { roleName: roleName.toLowerCase() }
        });

        if (existingRole) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'A role with this name already exists'
            });
        }

        // Create the role
        const newRole = await Role.create({
            roleName: roleName.toLowerCase(),
            displayName,
            description: description || null,
            isSystem: false, // Custom roles are never system roles
            status: 'active'
        }, { transaction });

        // Assign permissions if provided
        if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
            const rolePermissions = permissionIds.map(permId => ({
                roleId: newRole.roleId,
                permissionId: permId
            }));
            await RolePermission.bulkCreate(rolePermissions, { transaction });
        }

        await transaction.commit();

        // Log activity
        await logActivity({
            userId,
            action: 'ROLE_CREATED',
            resourceType: 'Role',
            resourceId: newRole.roleId,
            details: `Created new role "${newRole.displayName}" with ${permissionIds?.length || 0} permissions`
        });

        // Fetch the created role with permissions
        const createdRole = await Role.findByPk(newRole.roleId, {
            include: [{
                model: Permission,
                through: { attributes: [] }
            }]
        });

        return res.status(201).json({
            success: true,
            message: 'Role created successfully',
            role: createdRole
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create role',
            error: error.message
        });
    }
}

/**
 * Update an existing role
 */
async function updateRole(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const { roleId } = req.params;
        const { displayName, description, permissionIds, userId } = req.body;

        const role = await Role.findByPk(roleId);

        if (!role) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Update role details
        if (displayName) role.displayName = displayName;
        if (description !== undefined) role.description = description;

        await role.save({ transaction });

        // Update permissions if provided
        if (permissionIds && Array.isArray(permissionIds)) {
            // Remove existing permissions
            await RolePermission.destroy({
                where: { roleId },
                transaction
            });

            // Add new permissions
            if (permissionIds.length > 0) {
                const rolePermissions = permissionIds.map(permId => ({
                    roleId: parseInt(roleId),
                    permissionId: permId
                }));
                await RolePermission.bulkCreate(rolePermissions, { transaction });
            }
        }

        await transaction.commit();

        // Log activity
        await logActivity({
            userId,
            action: 'ROLE_UPDATED',
            resourceType: 'Role',
            resourceId: roleId,
            details: `Updated role "${role.displayName}" - now has ${permissionIds?.length || 0} permissions`
        });

        // Fetch updated role with permissions
        const updatedRole = await Role.findByPk(roleId, {
            include: [{
                model: Permission,
                through: { attributes: [] }
            }]
        });

        return res.json({
            success: true,
            message: 'Role updated successfully',
            role: updatedRole
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update role',
            error: error.message
        });
    }
}

/**
 * Delete a role (soft delete - set to inactive)
 */
async function archiveRole(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const { roleId } = req.params;
        const { userId } = req.body;

        const role = await Role.findByPk(roleId);

        if (!role) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Prevent archiving of system roles
        if (role.isSystem) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'System roles cannot be archived'
            });
        }

        // Find all users with this role
        const usersWithRole = await User.findAll({
            where: { roleId, status: 'active' },
            transaction
        });

        // Archive all users with this role
        if (usersWithRole.length > 0) {
            await User.update(
                { status: 'inactive' },
                { where: { roleId, status: 'active' }, transaction }
            );

            // Log activity for each archived user
            for (const archivedUser of usersWithRole) {
                await logActivity({
                    userId,
                    action: 'USER_ARCHIVED',
                    resourceType: 'User',
                    resourceId: archivedUser.userId,
                    details: `Archived user "${archivedUser.email}" due to role "${role.displayName}" being archived`
                });
            }
        }

        // Archive the role
        role.status = 'inactive';
        await role.save({ transaction });

        await transaction.commit();

        // Log role archive activity
        await logActivity({
            userId,
            action: 'ROLE_ARCHIVED',
            resourceType: 'Role',
            resourceId: roleId,
            details: `Archived role "${role.displayName}" and ${usersWithRole.length} associated user(s)`
        });

        return res.json({
            success: true,
            message: `Role archived successfully. ${usersWithRole.length} user(s) were also archived.`,
            archivedUsersCount: usersWithRole.length
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error archiving role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to archive role',
            error: error.message
        });
    }
}

/**
 * Get all permissions (grouped by category)
 */
async function getAllPermissions(req, res) {
    try {
        const permissions = await Permission.findAll({
            order: [['category', 'ASC'], ['displayName', 'ASC']]
        });

        // Group permissions by category
        const grouped = permissions.reduce((acc, perm) => {
            const category = perm.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                permissionId: perm.permissionId,
                permissionKey: perm.permissionKey,
                displayName: perm.displayName,
                description: perm.description
            });
            return acc;
        }, {});

        return res.json({
            success: true,
            permissions: grouped,
            total: permissions.length
        });
    } catch (error) {
        console.error('Error getting permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch permissions',
            error: error.message
        });
    }
}

/**
 * Assign a role to a user
 */
async function assignRoleToUser(req, res) {
    try {
        const { targetUserId, roleId, userId } = req.body;

        if (!targetUserId || !roleId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Role ID are required'
            });
        }

        const user = await User.findByPk(targetUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        const oldRoleId = user.roleId;
        const oldRoleName = user.role;
        
        // Get old role display name for better logging
        let oldRoleDisplayName = oldRoleName || 'None';
        if (oldRoleId) {
            const oldRole = await Role.findByPk(oldRoleId);
            if (oldRole) {
                oldRoleDisplayName = oldRole.displayName;
            }
        }

        user.roleId = roleId;

        // Also update the legacy role field for backward compatibility
        user.role = role.roleName;

        await user.save();

        // Log activity with old and new role information
        await logActivity({
            userId,
            action: 'USER_ROLE_CHANGED',
            resourceType: 'USER',
            resourceId: targetUserId,
            details: `Changed role for ${user.email} from "${oldRoleDisplayName}" to "${role.displayName}"`,
            ipAddress: req.ip || '127.0.0.1',
            metadata: {
                oldRoleId,
                oldRoleName: oldRoleDisplayName,
                newRoleId: roleId,
                newRoleName: role.displayName
            }
        });

        return res.json({
            success: true,
            message: 'Role assigned successfully',
            user: {
                userId: user.userId,
                email: user.email,
                roleId: user.roleId,
                roleName: role.roleName
            }
        });
    } catch (error) {
        console.error('Error assigning role:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign role',
            error: error.message
        });
    }
}

/**
 * Get user permissions (for frontend use)
 */
async function getUserPermissions(req, res) {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId, {
            include: [{
                model: Role,
                include: [{
                    model: Permission,
                    through: { attributes: [] }
                }]
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const permissions = user.Role?.Permissions?.map(p => p.permissionKey) || [];

        return res.json({
            success: true,
            userId: user.userId,
            roleId: user.roleId,
            roleName: user.Role?.roleName,
            roleDisplayName: user.Role?.displayName,
            permissions
        });
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user permissions',
            error: error.message
        });
    }
}

module.exports = {
    getAllRoles,
    getRoleById,
    createRole,
    updateRole,
    archiveRole,
    getAllPermissions,
    assignRoleToUser,
    getUserPermissions
};

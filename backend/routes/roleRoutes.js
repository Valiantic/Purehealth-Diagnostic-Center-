const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Get all roles
router.get('/', roleController.getAllRoles);

// Get all permissions (grouped by category)
router.get('/permissions', roleController.getAllPermissions);

// Get user's permissions
router.get('/user/:userId/permissions', roleController.getUserPermissions);

// Get single role by ID
router.get('/:roleId', roleController.getRoleById);

// Create new role
router.post('/', roleController.createRole);

// Update role
router.put('/:roleId', roleController.updateRole);

// Archive role (soft delete and archive users)
router.delete('/:roleId', roleController.archiveRole);

// Assign role to user
router.post('/assign', roleController.assignRoleToUser);

module.exports = router;

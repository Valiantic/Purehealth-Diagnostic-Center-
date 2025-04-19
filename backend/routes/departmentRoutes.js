const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Get all Department
router.get('/', departmentController.getAllDepartments);
// Create a new department
router.post('/', departmentController.createDepartment);
// Update department status
router.put('/:departmentId/status', departmentController.updateDepartmentStatus);
// Update department details
router.put('/:departmentId', departmentController.updateDepartment);

module.exports = router;

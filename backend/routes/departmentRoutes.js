const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Get all departments
router.get('/', departmentController.getAllDepartments);

// Add a new department
router.post('/', departmentController.createDepartment);

// Update department status
router.patch('/:id', departmentController.updateDepartmentStatus);

module.exports = router;

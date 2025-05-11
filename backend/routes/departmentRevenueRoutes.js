const express = require('express');
const router = express.Router();
const departmentRevenueController = require('../controllers/departmentRevenueController');

// Get revenue by department
router.get('/by-department', departmentRevenueController.getRevenueByDepartment);

// Get revenue trend
router.get('/trend', departmentRevenueController.getRevenueTrend);

// Get refunds by department
router.get('/refunds', departmentRevenueController.getRefundsByDepartment);

module.exports = router;

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/monthly-data', dashboardController.getMonthlyData);
router.get('/daily-income', dashboardController.getDailyIncomeData);
router.get('/expenses-by-department', dashboardController.getExpensesByDepartment);
router.get('/monthly-profit', dashboardController.getMonthlyProfitData);

module.exports = router;
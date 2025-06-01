const express = require('express');
const router = express.Router();
const monthlyIncomeController = require('../controllers/monthlyIncomeController');

// Get monthly income data
router.get('/', monthlyIncomeController.getMonthlyIncome);

// Get monthly income summary
router.get('/summary', monthlyIncomeController.getMonthlyIncomeSummary);

module.exports = router;

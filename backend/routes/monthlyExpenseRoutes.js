const express = require('express');
const router = express.Router();
const monthlyExpenseController = require('../controllers/monthlyExpenseController');

// Routes for monthly expenses
router.get('/', monthlyExpenseController.getMonthlyExpenses);
router.get('/summary', monthlyExpenseController.getMonthlyExpensesSummary);

module.exports = router;

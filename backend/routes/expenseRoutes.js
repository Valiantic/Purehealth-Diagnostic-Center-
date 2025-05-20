const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);

// Add missing routes for single expense operations
router.get('/:expenseId', expenseController.getExpenseById);
router.put('/:expenseId', expenseController.updateExpense);

module.exports = router;

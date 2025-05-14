const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/', expenseController.createExpense);

router.get('/', expenseController.getExpenses);

module.exports = router;

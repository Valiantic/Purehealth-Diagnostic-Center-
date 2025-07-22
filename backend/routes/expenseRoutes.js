const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.put('/:id', expenseController.updateExpense);

// Category routes - Must come BEFORE /:id route to avoid conflicts
router.get('/categories', expenseController.getAllCategories);
router.get('/categories/:id', expenseController.getCategoryById);
router.post('/categories', expenseController.createCategory);
router.put('/categories/:id', expenseController.updateCategory);

router.get('/:id', expenseController.getExpenseById);

module.exports = router;

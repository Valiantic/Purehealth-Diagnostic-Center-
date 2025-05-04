const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions with pagination
router.get('/', transactionController.getAllTransactions);

// Search transactions - this must come before /:id route
router.get('/search', transactionController.searchTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update transaction status
router.patch('/:id', transactionController.updateTransactionStatus);

// Update transaction
router.put('/:id', transactionController.updateTransaction);

module.exports = router;

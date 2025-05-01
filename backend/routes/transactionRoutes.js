const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions with pagination
router.get('/', transactionController.getAllTransactions);

// Search transactions by name or date range
router.get('/search', transactionController.searchTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update transaction status
router.patch('/:id', transactionController.updateTransactionStatus);

module.exports = router;

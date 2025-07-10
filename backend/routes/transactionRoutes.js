const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Create a new transaction
router.post('/', transactionController.createTransaction);

// Get all transactions with pagination
router.get('/', transactionController.getAllTransactions);

// Route to check if MC# exists - MUST come before /:id route
router.get('/check-mcno', transactionController.checkMcNoExists);

// Search transactions - MUST come before /:id route
router.get('/search', transactionController.searchTransactions);

// Get transactions by referrer ID - MUST come before /:id route
router.get('/by-referrer', transactionController.getTransactionsByReferrerId);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Update transaction status
router.patch('/:id/status', transactionController.updateTransactionStatus);

// Update transaction
router.put('/:id', transactionController.updateTransaction);

module.exports = router;

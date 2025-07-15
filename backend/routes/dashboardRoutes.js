const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const { month, year } = req.query;
    console.log('📊 HTTP request for dashboard metrics:', { month, year });
    
    const metrics = await dashboardService.getDashboardMetrics(month, year);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard metrics via HTTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
});

// GET /api/dashboard/debug - Debug database state
router.get('/debug', async (req, res) => {
  try {
    const { Transaction, Expense, ExpenseItem } = require('../models');
    
    // Check transaction count
    const transactionCount = await Transaction.count();
    
    // Check expense count
    const expenseCount = await Expense.count();
    
    // Check expense item count
    const expenseItemCount = await ExpenseItem.count();
    
    // Get sample expense items
    const sampleExpenseItems = await ExpenseItem.findAll({
      limit: 5,
      include: [{
        model: Expense,
        attributes: ['expenseId', 'date', 'name']
      }]
    });
    
    res.json({
      success: true,
      data: {
        transactionCount,
        expenseCount,
        expenseItemCount,
        sampleExpenseItems
      }
    });
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const rebateController = require('../controllers/rebateController');

// Get rebates by date
router.get('/by-date', rebateController.getRebatesByDate);

// Get monthly rebate summary
router.get('/monthly', rebateController.getMonthlyRebates);

// Get rebates by referrer
router.get('/by-referrer', rebateController.getRebatesByReferrer);

module.exports = router;
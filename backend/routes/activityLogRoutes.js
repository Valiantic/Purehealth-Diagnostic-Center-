const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');

// Get all activity logs (with search, pagination)
router.get('/', activityLogController.getActivityLogs);

module.exports = router;

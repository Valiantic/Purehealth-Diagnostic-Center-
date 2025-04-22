const express = require('express');
const router = express.Router();
const referrerController = require('../controllers/referrerController.js');

// Get all referrers
router.get('/', referrerController.getAllReferrers);

// Search Referrers
router.get('/search', referrerController.searchReferrer);

// Create new referrer
router.post('/', referrerController.createReferrer);

// Update referrer
router.put('/:id', referrerController.updateReferrer);

// Update referrer status
router.patch('/:id', referrerController.updateReferrerStatus);

module.exports = router;
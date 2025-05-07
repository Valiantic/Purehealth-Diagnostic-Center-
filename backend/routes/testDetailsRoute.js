const express = require('express');
const router = express.Router();
const testDetailsController = require('../controllers/testDetailsController');

// Update test detail
router.put('/:id', testDetailsController.updateTestDetail);

module.exports = router;

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Settings routes
router.get('/general', settingsController.getAllSettings);
router.get('/general/:key', settingsController.getSettingByKey);
router.put('/general/:key', settingsController.updateSetting);

// Discount category routes
router.get('/discount-categories', settingsController.getAllDiscountCategories);
router.post('/discount-categories', settingsController.createDiscountCategory);
router.put('/discount-categories/:id', settingsController.updateDiscountCategory);
router.delete('/discount-categories/:id', settingsController.deleteDiscountCategory);

module.exports = router;

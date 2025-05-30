const express = require('express');
const router = express.Router();
const collectibleIncomeController = require('../controllers/collectibleIncomeController');

router.post('/', collectibleIncomeController.createCollectibleIncome);
router.get('/', collectibleIncomeController.getCollectibleIncome);

module.exports = router;
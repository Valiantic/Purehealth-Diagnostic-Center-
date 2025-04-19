const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/', testController.getAllTests);
router.post('/', testController.createTest);
router.put('/:id', testController.updateTest);

module.exports = router;

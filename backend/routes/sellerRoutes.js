const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

router.post('/apply', sellerController.applyForSeller);
router.get('/status/:userId', sellerController.getApplicationStatus);

module.exports = router;

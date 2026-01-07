const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/seller-requests', adminController.getAllApplications);
router.get('/seller-requests', adminController.getAllApplications);
router.patch('/seller-requests/:applicationId/status', adminController.updateApplicationStatus);

module.exports = router;

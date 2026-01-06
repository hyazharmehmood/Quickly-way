const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/seller-requests', adminController.getPendingApplications);
router.post('/seller-approve/:applicationId', adminController.approveApplication);
router.post('/seller-reject/:applicationId', adminController.rejectApplication);

module.exports = router;

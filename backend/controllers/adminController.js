const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const { SELLER_STATUS, USER_ROLES, HTTP_STATUS } = require('@quicklyway/shared');

/**
 * Get all seller applications
 */
exports.getAllApplications = async (req, res, next) => {
    try {
        const applications = await SellerApplication.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.status(HTTP_STATUS.OK).json(applications);
    } catch (error) {
        next(error);
    }
};

/**
 * Update seller application status (Approve/Reject)
 */
exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const { status, reason } = req.body;

        if (![SELLER_STATUS.APPROVED, SELLER_STATUS.REJECTED].includes(status)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid status update.' });
        }

        const updateData = { status };
        if (status === SELLER_STATUS.REJECTED) {
            updateData.rejectionReason = reason;
        }

        const application = await SellerApplication.findByIdAndUpdate(
            applicationId,
            updateData,
            { new: true }
        );

        if (!application) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Application not found.' });
        }

        // Update User model based on status
        const userUpdate = { sellerStatus: status };
        if (status === SELLER_STATUS.APPROVED) {
            userUpdate.isSeller = true;
            userUpdate.role = USER_ROLES.FREELANCER;
        }

        await User.findByIdAndUpdate(application.userId, userUpdate);

        res.status(HTTP_STATUS.OK).json({
            message: `Application ${status} successfully.`,
            application,
        });
    } catch (error) {
        next(error);
    }
};

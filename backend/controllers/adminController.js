const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const { SELLER_STATUS, USER_ROLES, HTTP_STATUS } = require('@quicklyway/shared');

/**
 * Get all pending seller applications
 */
exports.getPendingApplications = async (req, res, next) => {
    try {
        const applications = await SellerApplication.find({ status: SELLER_STATUS.PENDING })
            .populate('userId', 'name email');
        res.status(HTTP_STATUS.OK).json(applications);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve seller application
 */
exports.approveApplication = async (req, res, next) => {
    try {
        const { applicationId } = req.params;

        const application = await SellerApplication.findByIdAndUpdate(
            applicationId,
            { status: SELLER_STATUS.APPROVED },
            { new: true }
        );

        if (!application) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Application not found.' });
        }

        // Update user to freelancer
        await User.findByIdAndUpdate(application.userId, {
            sellerStatus: SELLER_STATUS.APPROVED,
            isSeller: true,
            role: USER_ROLES.FREELANCER,
        });

        res.status(HTTP_STATUS.OK).json({
            message: 'Application approved successfully.',
            application,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject seller application
 */
exports.rejectApplication = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const { reason } = req.body;

        const application = await SellerApplication.findByIdAndUpdate(
            applicationId,
            {
                status: SELLER_STATUS.REJECTED,
                rejectionReason: reason,
            },
            { new: true }
        );

        if (!application) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Application not found.' });
        }

        // Update user status
        await User.findByIdAndUpdate(application.userId, {
            sellerStatus: SELLER_STATUS.REJECTED,
        });

        res.status(HTTP_STATUS.OK).json({
            message: 'Application rejected.',
            application,
        });
    } catch (error) {
        next(error);
    }
};

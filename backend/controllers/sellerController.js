const SellerApplication = require('../models/SellerApplication');
const User = require('../models/User');
const { SELLER_STATUS, HTTP_STATUS } = require('@quicklyway/shared');

/**
 * Apply to become a seller
 */
exports.applyForSeller = async (req, res, next) => {
    try {
        const { userId, fullName, skills, bio, portfolio } = req.body;

        // Check if application already exists
        const existingApp = await SellerApplication.findOne({ userId });
        if (existingApp && existingApp.status === SELLER_STATUS.PENDING) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Your application is already pending review.',
            });
        }

        // Create or update application
        const application = await SellerApplication.findOneAndUpdate(
            { userId },
            {
                fullName,
                skills,
                bio,
                portfolio,
                status: SELLER_STATUS.PENDING,
                rejectionReason: null,
            },
            { new: true, upsert: true }
        );

        // Update user status
        await User.findByIdAndUpdate(userId, { sellerStatus: SELLER_STATUS.PENDING });

        res.status(HTTP_STATUS.CREATED).json({
            message: 'Application submitted successfully.',
            application,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get seller application status
 */
exports.getApplicationStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const application = await SellerApplication.findOne({ userId });

        if (!application) {
            return res.status(HTTP_STATUS.OK).json({ status: SELLER_STATUS.NONE });
        }

        res.status(HTTP_STATUS.OK).json(application);
    } catch (error) {
        next(error);
    }
};

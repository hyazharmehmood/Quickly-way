const mongoose = require('mongoose');

const sellerApplicationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        skills: [String],
        bio: {
            type: String,
            required: true,
        },
        portfolio: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        rejectionReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('SellerApplication', sellerApplicationSchema);

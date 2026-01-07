const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { HTTP_STATUS } = require('@quicklyway/shared');

/**
 * Sign up a new user
 */
exports.signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'A user with this email already exists.',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        // Generate JWTs
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(HTTP_STATUS.CREATED).json({
            message: 'User registered successfully.',
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSeller: user.isSeller,
                sellerStatus: user.sellerStatus,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Log in an existing user
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                message: 'Invalid email or password.',
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                message: 'Invalid email or password.',
            });
        }

        // Generate JWTs
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(HTTP_STATUS.OK).json({
            message: 'Logged in successfully.',
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSeller: user.isSeller,
                sellerStatus: user.sellerStatus,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'User not found.',
            });
        }

        res.status(HTTP_STATUS.OK).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSeller: user.isSeller,
                sellerStatus: user.sellerStatus,
                rejectionReason: user.rejectionReason,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Refresh tokens
 */
exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Refresh token is required.',
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'refresh_secret'
        );

        // Find user and check if refresh token matches
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                message: 'Invalid refresh token.',
            });
        }

        // Generate new JWTs
        const newToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET || 'refresh_secret',
            { expiresIn: '7d' }
        );

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(HTTP_STATUS.OK).json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                message: 'Invalid or expired refresh token. Please login again.',
            });
        }
        next(error);
    }
};

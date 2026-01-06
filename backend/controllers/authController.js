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

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.status(HTTP_STATUS.CREATED).json({
            message: 'User registered successfully.',
            token,
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

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.status(HTTP_STATUS.OK).json({
            message: 'Logged in successfully.',
            token,
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

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'Quicklyway';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'QuicklywayRefresh';

/**
 * Verify a JWT token
 * @param {String} token 
 * @returns {Object} decoded payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Return null if invalid or expired
    }
};

module.exports = { verifyToken };


import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Quicklyway';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'QuicklywayRefresh';

/**
 * Sign a JWT token
 * @param {Object} payload 
 * @param {String} expiresIn 
 * @returns {String} token
 */
export const signToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Sign a Refresh token
 * @param {Object} payload 
 * @param {String} expiresIn 
 * @returns {String} token
 */
export const signRefreshToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {String} token 
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Return null if invalid or expired
    }
};

/**
 * Verify a Refresh token
 * @param {String} token 
 * @returns {Object} decoded payload
 */
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Decode a token without signature verification
 */
export const decodeToken = (token) => {
    return jwt.decode(token);
};

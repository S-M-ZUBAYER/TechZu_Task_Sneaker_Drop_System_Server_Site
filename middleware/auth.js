import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

/**
 * JWT Authentication Middleware
 * Protects routes by verifying JWT tokens
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.',
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] },
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. User not found.',
                });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired. Please login again.',
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token.',
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.',
        });
    }
};

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {string} - JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block request
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findByPk(decoded.id, {
                    attributes: { exclude: ['password'] },
                });

                if (user) {
                    req.user = user;
                }
            } catch (error) {
                // Silently fail - user will be undefined
            }
        }

        next();
    } catch (error) {
        next();
    }
};

export default { authenticate, generateToken, optionalAuth };
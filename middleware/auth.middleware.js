/**
 * Authentication middleware for LagoTrade API
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
    try {
        // Bypass auth check for now - DEBUG MODE
        console.log('AUTH MIDDLEWARE - DEBUG MODE ACTIVE');

        // Create a fake user object
        req.user = {
            _id: 'debug-user-id',
            name: 'Debug User',
            email: 'debug@example.com',
            role: 'user',
            isVerified: true
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        next(error);
    }
};

// Optional middleware to check admin role
const adminMiddleware = (req, res, next) => {
    // Always allow in debug mode
    next();
};

module.exports = { authMiddleware, adminMiddleware }; 
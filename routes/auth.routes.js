/**
 * Authentication routes for LagoTrade API
 */

const express = require('express');
const {
    register,
    login,
    refreshToken,
    googleAuth,
    forgotPassword,
    resetPassword
} = require('../controllers/auth.controller');

const router = express.Router();

// Registration and verification
router.post('/register', register);

// Authentication
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/google', googleAuth);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router; 
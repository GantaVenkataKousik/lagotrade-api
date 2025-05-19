/**
 * User routes for LagoTrade API
 */

const express = require('express');
const {
    updateUserProfile,
    getUserProfile,
    sendMobileVerificationOTP,
    verifyMobileOTP,
    getOnboardingStatus,
    getDataStatus
} = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes use auth middleware
router.use(authMiddleware);

// Profile routes
router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);

// Mobile verification routes
router.post('/verify-mobile/send', sendMobileVerificationOTP);
router.post('/verify-mobile/verify', verifyMobileOTP);

// Onboarding status
router.get('/onboarding-status', getOnboardingStatus);

// Data status (real vs dummy)
router.get('/data-status', getDataStatus);

module.exports = router; 
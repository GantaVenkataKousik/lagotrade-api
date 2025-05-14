/**
 * User routes for LagoTrade API
 */

const express = require('express');
const {
    getCurrentUser,
    updateUserProfile,
    changePassword,
    deleteAccount
} = require('../controllers/user.controller');

const router = express.Router();

// All these routes already have authMiddleware applied in server.js
router.get('/me', getCurrentUser);
router.put('/me', updateUserProfile);
router.post('/change-password', changePassword);
router.delete('/me', deleteAccount);

module.exports = router; 
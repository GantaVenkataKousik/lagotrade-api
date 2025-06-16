const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const {
    getAlertPreferences,
    updateAlertPreferences,
    getCustomAlerts,
    createCustomAlert,
    updateCustomAlert,
    deleteCustomAlert
} = require('../controllers/alert.controller');

// Alert preferences routes
router.get('/preferences', authMiddleware, getAlertPreferences);
router.put('/preferences', authMiddleware, updateAlertPreferences);

// Custom alerts routes
router.get('/custom', authMiddleware, getCustomAlerts);
router.post('/custom', authMiddleware, createCustomAlert);
router.put('/custom/:id', authMiddleware, updateCustomAlert);
router.delete('/custom/:id', authMiddleware, deleteCustomAlert);

module.exports = router; 
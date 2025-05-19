/**
 * Notification routes for LagoTrade API
 */

const express = require('express');
const {
    updateNotificationPreferences
} = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Notification preferences routes
router.put('/preferences', updateNotificationPreferences);

// WhatsApp test notification endpoint
router.post('/test-whatsapp', async (req, res) => {
    try {
        const { to } = req.body;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Import WhatsApp service
        const whatsappService = require('../services/whatsapp.service');

        // Send a test template message
        await whatsappService.sendTemplateMessage(to, 'hello_world', 'en_US');

        return res.status(200).json({
            success: true,
            message: 'WhatsApp test message sent successfully'
        });
    } catch (error) {
        console.error('Error sending WhatsApp test message:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Error sending WhatsApp message'
        });
    }
});

module.exports = router; 
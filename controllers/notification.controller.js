/**
 * Notification Controller for LagoTrade API
 */

const User = require('../models/user.model');
const { sendWhatsAppMessage, sendStockUpdateWhatsApp } = require('../utils/whatsapp.utils');
const { sendSMS } = require('../utils/sms.utils');

/**
 * Update user's notification preferences
 * @route PUT /api/notifications/preferences
 */
exports.updateNotificationPreferences = async (req, res) => {
    try {
        const { email, push, sms, whatsapp } = req.body;

        // Validate at least one notification type is enabled
        if (email === false && push === false && sms === false && whatsapp === false) {
            return res.status(400).json({
                success: false,
                error: 'At least one notification type must be enabled'
            });
        }

        // Find user and update notification preferences
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    'preferences.notifications.email': email,
                    'preferences.notifications.push': push,
                    'preferences.notifications.sms': sms,
                    'preferences.notifications.whatsapp': whatsapp
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification preferences updated',
            data: {
                preferences: user.preferences.notifications
            }
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Test WhatsApp notification
 * @route POST /api/notifications/test-whatsapp
 */
exports.testWhatsAppNotification = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user has verified mobile number
        if (!user.mobileVerification || !user.mobileVerification.isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Mobile number not verified. Please verify your mobile number first.'
            });
        }

        // Send test message
        const testMessage = `Hello ${user.name}, this is a test notification from LagoTrade. You will receive market updates and alerts on this WhatsApp number.`;

        await sendWhatsAppMessage(user.phone, testMessage);

        res.status(200).json({
            success: true,
            message: 'Test WhatsApp notification sent successfully'
        });
    } catch (error) {
        console.error('Test WhatsApp notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Send stock alert to user
 * @param {string} userId - User ID
 * @param {object} stockAlert - Stock alert data
 */
exports.sendStockAlert = async (userId, stockAlert) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            console.error('User not found for stock alert:', userId);
            return;
        }

        const { preferences } = user;

        // Check if user has verified mobile and enabled WhatsApp notifications
        if (preferences.notifications.whatsapp &&
            user.mobileVerification &&
            user.mobileVerification.isVerified) {
            await sendStockUpdateWhatsApp(user.phone, stockAlert);
        }

        // Send SMS if enabled
        if (preferences.notifications.sms &&
            user.mobileVerification &&
            user.mobileVerification.isVerified) {
            const symbol = stockAlert.symbol;
            const price = stockAlert.price.toFixed(2);
            const change = stockAlert.change >= 0 ?
                `+${stockAlert.change.toFixed(2)}` :
                stockAlert.change.toFixed(2);

            await sendSMS(
                user.phone,
                `LagoTrade Alert: ${symbol} at ₹${price} (${change}). Check app for details.`
            );
        }

        // Additional notification channels can be added here (push, email)

        console.log(`Stock alert sent to user ${userId} for ${stockAlert.symbol}`);
    } catch (error) {
        console.error('Error sending stock alert:', error);
    }
};

module.exports = exports; 
const AlertPreferences = require('../models/alert-preferences.model');
const CustomAlert = require('../models/custom-alert.model');

// Get user's alert preferences
exports.getAlertPreferences = async (req, res) => {
    try {
        let preferences = await AlertPreferences.findOne({ userId: req.user._id });

        if (!preferences) {
            // Create default preferences if none exist
            preferences = await AlertPreferences.create({
                userId: req.user._id,
                email: req.user.email,
                frequency: '5min',
                marketAlerts: true,
                priceAlerts: true,
                volumeAlerts: false,
                technicalAlerts: false
            });
        }

        res.status(200).json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Get alert preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get alert preferences',
            error: error.message
        });
    }
};

// Update alert preferences
exports.updateAlertPreferences = async (req, res) => {
    try {
        const {
            email,
            frequency,
            marketAlerts,
            priceAlerts,
            volumeAlerts,
            technicalAlerts
        } = req.body;

        const preferences = await AlertPreferences.findOneAndUpdate(
            { userId: req.user._id },
            {
                email,
                frequency,
                marketAlerts,
                priceAlerts,
                volumeAlerts,
                technicalAlerts
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Update alert preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update alert preferences',
            error: error.message
        });
    }
};

// Get user's custom alerts
exports.getCustomAlerts = async (req, res) => {
    try {
        const alerts = await CustomAlert.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Get custom alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get custom alerts',
            error: error.message
        });
    }
};

// Create custom alert
exports.createCustomAlert = async (req, res) => {
    try {
        const { symbol, condition, value, frequency } = req.body;

        // Validate required fields
        if (!symbol || !condition || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        const alert = await CustomAlert.create({
            userId: req.user._id,
            symbol: symbol.toUpperCase(),
            condition,
            value,
            frequency: frequency || '5min',
            active: true
        });

        res.status(201).json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Create custom alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create custom alert',
            error: error.message
        });
    }
};

// Update custom alert
exports.updateCustomAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        const alert = await CustomAlert.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { active },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Update custom alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update custom alert',
            error: error.message
        });
    }
};

// Delete custom alert
exports.deleteCustomAlert = async (req, res) => {
    try {
        const { id } = req.params;

        const alert = await CustomAlert.findOneAndDelete({
            _id: id,
            userId: req.user._id
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        console.error('Delete custom alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete custom alert',
            error: error.message
        });
    }
}; 
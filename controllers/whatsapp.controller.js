const whatsappService = require('../services/whatsapp.service');

// Send template message
exports.sendTemplate = async (req, res) => {
    try {
        const { to, templateName, language, components } = req.body;

        if (!to || !templateName) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and template name are required'
            });
        }

        const result = await whatsappService.sendTemplateMessage(to, templateName, language, components);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Send text message
exports.sendText = async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and message are required'
            });
        }

        const result = await whatsappService.sendTextMessage(to, message);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Send trading alert
exports.sendTradingAlert = async (req, res) => {
    try {
        const { to, alertData } = req.body;

        if (!to || !alertData) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and alert data are required'
            });
        }

        const result = await whatsappService.sendTradingAlert(to, alertData);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Send market summary
exports.sendMarketSummary = async (req, res) => {
    try {
        const { to, marketData } = req.body;

        if (!to || !marketData) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and market data are required'
            });
        }

        const result = await whatsappService.sendMarketSummary(to, marketData);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Test-only endpoint for quick verification
exports.testWhatsapp = async (req, res) => {
    try {
        const to = req.body.to;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required for testing'
            });
        }

        await whatsappService.sendTemplateMessage(to, 'hello_world', 'en_US');

        return res.status(200).json({
            success: true,
            message: 'Test message sent successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 
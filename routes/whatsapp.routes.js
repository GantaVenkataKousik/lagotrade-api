const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Public test route
router.post('/test', whatsappController.testWhatsapp);

// Protected routes - require authentication
router.post('/template', authMiddleware, whatsappController.sendTemplate);
router.post('/text', authMiddleware, whatsappController.sendText);
router.post('/trading-alert', authMiddleware, whatsappController.sendTradingAlert);
router.post('/market-summary', authMiddleware, whatsappController.sendMarketSummary);

module.exports = router; 
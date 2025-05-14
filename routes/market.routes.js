/**
 * Market routes for LagoTrade API
 */

const express = require('express');
const {
    getMarketQuotes,
    getMarketIndices,
    searchInstruments,
    getHistoricalData
} = require('../controllers/market.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/quotes', getMarketQuotes);
router.get('/indices', getMarketIndices);
router.get('/search', searchInstruments);

// Auth required for historical data
router.get('/historical', authMiddleware, getHistoricalData);

module.exports = router; 
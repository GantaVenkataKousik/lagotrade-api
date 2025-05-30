const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const auth = require('../middleware/auth');

// @route   GET /api/portfolio
// @desc    Get user's portfolio
// @access  Private
router.get('/', auth, portfolioController.getPortfolio);

// @route   PUT /api/portfolio/asset
// @desc    Update portfolio asset
// @access  Private
router.put('/asset', auth, portfolioController.updateAsset);

// @route   GET /api/portfolio/performance
// @desc    Get portfolio performance
// @access  Private
router.get('/performance', auth, portfolioController.getPerformance);

// @route   PUT /api/portfolio/cash
// @desc    Update cash balance
// @access  Private
router.put('/cash', auth, portfolioController.updateCashBalance);

// @route   GET /api/portfolio/summary
// @desc    Get portfolio summary
// @access  Private
router.get('/summary', auth, portfolioController.getSummary);

module.exports = router; 
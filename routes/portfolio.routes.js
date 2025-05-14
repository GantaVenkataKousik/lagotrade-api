/**
 * Portfolio routes for LagoTrade API
 */

const express = require('express');
const {
    getPortfolioHoldings,
    getPortfolioTransactions,
    getFundsHistory,
    getBankAccounts,
    addBankAccount
} = require('../controllers/portfolio.controller');

const router = express.Router();

// All routes already have authMiddleware applied in server.js
router.get('/holdings', getPortfolioHoldings);
router.get('/transactions', getPortfolioTransactions);
router.get('/funds', getFundsHistory);
router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', addBankAccount);

module.exports = router; 
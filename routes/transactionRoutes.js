const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post(
    '/',
    [
        auth,
        check('type', 'Type is required').isIn(['BUY', 'SELL']),
        check('symbol', 'Symbol is required').not().isEmpty(),
        check('quantity', 'Quantity must be a positive number').isFloat({ min: 0 }),
        check('price', 'Price must be a positive number').isFloat({ min: 0 }),
        check('orderType', 'Order type is required').isIn(['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'])
    ],
    transactionController.createTransaction
);

// @route   GET /api/transactions
// @desc    Get user's transactions
// @access  Private
router.get('/', auth, transactionController.getTransactions);

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', auth, transactionController.getTransaction);

// @route   PUT /api/transactions/:id/cancel
// @desc    Cancel pending transaction
// @access  Private
router.put('/:id/cancel', auth, transactionController.cancelTransaction);

module.exports = router; 
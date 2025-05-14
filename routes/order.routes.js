/**
 * Order routes for LagoTrade API
 */

const express = require('express');
const {
    getOrders,
    getOrderById,
    placeOrder,
    cancelOrder
} = require('../controllers/order.controller');

const router = express.Router();

// All routes already have authMiddleware applied in server.js
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', placeOrder);
router.post('/:id/cancel', cancelOrder);

module.exports = router; 
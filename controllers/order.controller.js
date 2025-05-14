/**
 * Order Controller for LagoTrade API
 */

const { getPostgresUserId } = require('../utils/db.utils');
const { placeOrder } = require('../services/broker.service');
const BrokerIntegration = require('../models/broker-integration.model');

// Get user's orders
exports.getOrders = async (req, res, next) => {
    try {
        const { status, from, to, page = 1, limit = 10 } = req.query;

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Prepare query
        let query = `SELECT * FROM orders WHERE user_id = $1`;
        const queryParams = [pgUserId];

        // Filter by status if provided
        if (status) {
            query += ` AND status = $${queryParams.length + 1}`;
            queryParams.push(status.toUpperCase());
        }

        // Filter by date range if provided
        if (from) {
            query += ` AND placed_at >= $${queryParams.length + 1}`;
            queryParams.push(from);
        }

        if (to) {
            query += ` AND placed_at <= $${queryParams.length + 1}`;
            queryParams.push(to);
        }

        // Add order and pagination
        query += ` ORDER BY placed_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit);
        queryParams.push((page - 1) * limit);

        // Get orders
        const ordersResult = await pgPool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) FROM orders WHERE user_id = $1`;
        const countParams = [pgUserId];

        if (status) {
            countQuery += ` AND status = $2`;
            countParams.push(status.toUpperCase());
        }

        if (from) {
            countQuery += ` AND placed_at >= $${countParams.length + 1}`;
            countParams.push(from);
        }

        if (to) {
            countQuery += ` AND placed_at <= $${countParams.length + 1}`;
            countParams.push(to);
        }

        const countResult = await pgPool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Format orders
        const orders = ordersResult.rows.map(order => ({
            id: order.id,
            referenceId: order.reference_id,
            symbol: order.symbol,
            exchange: order.exchange,
            orderType: order.order_type,
            transactionType: order.transaction_type,
            quantity: order.quantity,
            price: order.price,
            triggerPrice: order.trigger_price,
            status: order.status,
            product: order.product,
            validity: order.validity,
            disclosedQuantity: order.disclosed_quantity,
            placedAt: order.placed_at,
            updatedAt: order.updated_at,
            executedAt: order.executed_at,
            brokerOrderId: order.broker_order_id,
            broker: order.broker,
            isAmo: order.is_amo
        }));

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Get order
        const orderResult = await pgPool.query(
            `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
            [id, pgUserId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Format order
        const formattedOrder = {
            id: order.id,
            referenceId: order.reference_id,
            symbol: order.symbol,
            exchange: order.exchange,
            orderType: order.order_type,
            transactionType: order.transaction_type,
            quantity: order.quantity,
            price: order.price,
            triggerPrice: order.trigger_price,
            status: order.status,
            product: order.product,
            validity: order.validity,
            disclosedQuantity: order.disclosed_quantity,
            placedAt: order.placed_at,
            updatedAt: order.updated_at,
            executedAt: order.executed_at,
            brokerOrderId: order.broker_order_id,
            broker: order.broker,
            isAmo: order.is_amo
        };

        res.status(200).json({
            success: true,
            data: formattedOrder
        });
    } catch (error) {
        next(error);
    }
};

// Place new order
exports.placeOrder = async (req, res, next) => {
    try {
        const {
            symbol,
            exchange,
            orderType,
            transactionType,
            quantity,
            price,
            triggerPrice,
            product,
            validity,
            disclosedQuantity,
            isAmo
        } = req.body;

        // Validate required fields
        if (!symbol || !exchange || !orderType || !transactionType || !quantity || !product) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate limit order requires price
        if (orderType === 'LIMIT' && !price) {
            return res.status(400).json({
                success: false,
                message: 'Price is required for LIMIT orders'
            });
        }

        // Validate stop loss order requires trigger price
        if (orderType === 'SL' && !triggerPrice) {
            return res.status(400).json({
                success: false,
                message: 'Trigger price is required for SL orders'
            });
        }

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        // Generate reference ID
        const referenceId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Get active broker integration
        const brokerIntegration = await BrokerIntegration.findOne({
            userId: req.user._id,
            isActive: true
        });

        if (!brokerIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active broker integration found'
            });
        }

        // Prepare order data
        const orderData = {
            symbol,
            exchange,
            orderType,
            transactionType,
            quantity,
            price: price || null,
            triggerPrice: triggerPrice || null,
            product,
            validity: validity || 'DAY',
            disclosedQuantity: disclosedQuantity || 0,
            isAmo: isAmo || false
        };

        // Place order with broker
        const brokerResponse = await placeOrder(orderData, brokerIntegration);

        const { pgPool } = req;

        // Save order to database
        const insertResult = await pgPool.query(
            `INSERT INTO orders 
        (user_id, reference_id, symbol, exchange, order_type, transaction_type, 
        quantity, price, trigger_price, status, product, validity, 
        disclosed_quantity, placed_at, broker_order_id, broker, is_amo) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14, $15, $16)
      RETURNING *`,
            [
                pgUserId,
                referenceId,
                symbol,
                exchange,
                orderType,
                transactionType,
                quantity,
                price || null,
                triggerPrice || null,
                brokerResponse.status,
                product,
                validity || 'DAY',
                disclosedQuantity || 0,
                brokerResponse.orderId,
                brokerIntegration.broker,
                isAmo || false
            ]
        );

        // Format response
        const newOrder = {
            id: insertResult.rows[0].id,
            referenceId: insertResult.rows[0].reference_id,
            symbol: insertResult.rows[0].symbol,
            exchange: insertResult.rows[0].exchange,
            orderType: insertResult.rows[0].order_type,
            transactionType: insertResult.rows[0].transaction_type,
            quantity: insertResult.rows[0].quantity,
            price: insertResult.rows[0].price,
            triggerPrice: insertResult.rows[0].trigger_price,
            status: insertResult.rows[0].status,
            product: insertResult.rows[0].product,
            validity: insertResult.rows[0].validity,
            placedAt: insertResult.rows[0].placed_at,
            brokerOrderId: insertResult.rows[0].broker_order_id,
            broker: insertResult.rows[0].broker
        };

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: newOrder
        });
    } catch (error) {
        next(error);
    }
};

// Cancel order
exports.cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Get order
        const orderResult = await pgPool.query(
            `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
            [id, pgUserId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const order = orderResult.rows[0];

        // Check if order can be cancelled
        if (['EXECUTED', 'CANCELLED', 'REJECTED'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is ${order.status}`
            });
        }

        // TODO: Implement actual broker cancellation

        // Update order status
        const updateResult = await pgPool.query(
            `UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                id: updateResult.rows[0].id,
                status: updateResult.rows[0].status,
                updatedAt: updateResult.rows[0].updated_at
            }
        });
    } catch (error) {
        next(error);
    }
}; 
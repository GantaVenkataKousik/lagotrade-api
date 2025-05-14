/**
 * Portfolio Controller
 * 
 * Handles requests related to user portfolio data.
 */

const Portfolio = require('../models/portfolio');
const { getPostgresUserId } = require('../utils/db.utils');
const { fetchUpstoxMarketData } = require('../services/broker.service');

/**
 * Get all portfolio holdings for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPortfolioHoldings = async (req, res) => {
    try {
        // Get PostgreSQL user ID from MongoDB user ID
        const userId = await getPostgresUserId(req.user.id);

        // Get all holdings for the user
        const holdings = await Portfolio.getHoldings(userId);

        return res.status(200).json({
            success: true,
            data: holdings
        });
    } catch (error) {
        console.error('Portfolio holdings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving portfolio holdings'
        });
    }
};

/**
 * Get portfolio summary for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPortfolioSummary = async (req, res) => {
    try {
        // Get PostgreSQL user ID from MongoDB user ID
        const userId = await getPostgresUserId(req.user.id);

        // Get portfolio summary
        const summary = await Portfolio.getPortfolioSummary(userId);

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Portfolio summary error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error retrieving portfolio summary'
        });
    }
};

/**
 * Add or update a portfolio holding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateHolding = async (req, res) => {
    try {
        // Get PostgreSQL user ID from MongoDB user ID
        const userId = await getPostgresUserId(req.user.id);

        // Validate required fields
        const { symbol, exchange, quantity, average_price } = req.body;

        if (!symbol || !exchange || !quantity || !average_price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Calculate derived values
        const current_price = req.body.current_price || average_price;
        const investment_value = quantity * average_price;
        const current_value = quantity * current_price;
        const pnl = current_value - investment_value;
        const pnl_percent = investment_value > 0
            ? (pnl / investment_value) * 100
            : 0;

        // Prepare holding object
        const holding = {
            user_id: userId,
            symbol,
            exchange,
            quantity,
            average_price,
            current_price,
            investment_value,
            current_value,
            pnl,
            pnl_percent
        };

        // Save to database
        const savedHolding = await Portfolio.upsertHolding(holding);

        return res.status(200).json({
            success: true,
            data: savedHolding
        });
    } catch (error) {
        console.error('Update holding error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error updating portfolio holding'
        });
    }
};

/**
 * Delete a portfolio holding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteHolding = async (req, res) => {
    try {
        // Get PostgreSQL user ID from MongoDB user ID
        const userId = await getPostgresUserId(req.user.id);

        const { symbol, exchange } = req.params;

        if (!symbol || !exchange) {
            return res.status(400).json({
                success: false,
                error: 'Symbol and exchange are required'
            });
        }

        // Delete the holding
        const deleted = await Portfolio.deleteHolding(userId, symbol, exchange);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Holding not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete holding error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error deleting portfolio holding'
        });
    }
};

// Get portfolio transactions
exports.getPortfolioTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type } = req.query;

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Prepare query
        let query = `
      SELECT t.*, o.order_type 
      FROM transactions t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.user_id = $1
    `;

        const queryParams = [pgUserId];

        // Filter by transaction type if provided
        if (type) {
            query += ` AND t.transaction_type = $2`;
            queryParams.push(type.toUpperCase());
        }

        // Add order and pagination
        query += ` ORDER BY t.transaction_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit);
        queryParams.push((page - 1) * limit);

        // Get transactions
        const transactionsResult = await pgPool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
      SELECT COUNT(*) 
      FROM transactions 
      WHERE user_id = $1
    `;

        const countParams = [pgUserId];

        if (type) {
            countQuery += ` AND transaction_type = $2`;
            countParams.push(type.toUpperCase());
        }

        const countResult = await pgPool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Format transactions
        const transactions = transactionsResult.rows.map(transaction => ({
            id: transaction.id,
            symbol: transaction.symbol,
            exchange: transaction.exchange,
            transactionType: transaction.transaction_type,
            orderType: transaction.order_type,
            quantity: transaction.quantity,
            price: transaction.price,
            totalAmount: transaction.total_amount,
            charges: transaction.charges,
            transactionAt: transaction.transaction_at,
            referenceId: transaction.reference_id,
            broker: transaction.broker
        }));

        res.status(200).json({
            success: true,
            data: {
                transactions,
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

// Get funds history
exports.getFundsHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type } = req.query;

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Prepare query
        let query = `
      SELECT f.*, b.account_number, b.bank_name 
      FROM funds f
      LEFT JOIN bank_accounts b ON f.bank_account_id = b.id
      WHERE f.user_id = $1
    `;

        const queryParams = [pgUserId];

        // Filter by transaction type if provided
        if (type) {
            query += ` AND f.transaction_type = $2`;
            queryParams.push(type.toUpperCase());
        }

        // Add order and pagination
        query += ` ORDER BY f.transaction_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit);
        queryParams.push((page - 1) * limit);

        // Get funds history
        const fundsResult = await pgPool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
      SELECT COUNT(*) 
      FROM funds 
      WHERE user_id = $1
    `;

        const countParams = [pgUserId];

        if (type) {
            countQuery += ` AND transaction_type = $2`;
            countParams.push(type.toUpperCase());
        }

        const countResult = await pgPool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Format funds history
        const funds = fundsResult.rows.map(fund => ({
            id: fund.id,
            transactionType: fund.transaction_type,
            amount: fund.amount,
            status: fund.status,
            description: fund.description,
            transactionAt: fund.transaction_at,
            referenceId: fund.reference_id,
            bankAccount: fund.bank_account_id ? {
                id: fund.bank_account_id,
                accountNumber: fund.account_number,
                bankName: fund.bank_name
            } : null
        }));

        res.status(200).json({
            success: true,
            data: {
                funds,
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

// Get bank accounts
exports.getBankAccounts = async (req, res, next) => {
    try {
        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Get bank accounts
        const bankAccountsResult = await pgPool.query(
            `SELECT * FROM bank_accounts WHERE user_id = $1 ORDER BY is_primary DESC`,
            [pgUserId]
        );

        // Format bank accounts
        const bankAccounts = bankAccountsResult.rows.map(account => ({
            id: account.id,
            accountName: account.account_name,
            accountNumber: account.account_number,
            ifscCode: account.ifsc_code,
            bankName: account.bank_name,
            isPrimary: account.is_primary,
            isVerified: account.is_verified,
            createdAt: account.created_at
        }));

        res.status(200).json({
            success: true,
            data: bankAccounts
        });
    } catch (error) {
        next(error);
    }
};

// Add new bank account
exports.addBankAccount = async (req, res, next) => {
    try {
        const { accountName, accountNumber, ifscCode, bankName } = req.body;

        // Validate required fields
        if (!accountName || !accountNumber || !ifscCode || !bankName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Get PostgreSQL user ID from MongoDB ID
        const pgUserId = await getPostgresUserId(req.user._id.toString());

        const { pgPool } = req;

        // Check if account already exists
        const existingAccount = await pgPool.query(
            `SELECT id FROM bank_accounts WHERE user_id = $1 AND account_number = $2`,
            [pgUserId, accountNumber]
        );

        if (existingAccount.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This bank account is already registered'
            });
        }

        // Check if this is the first account (to set as primary)
        const accountCount = await pgPool.query(
            `SELECT COUNT(*) FROM bank_accounts WHERE user_id = $1`,
            [pgUserId]
        );

        const isPrimary = parseInt(accountCount.rows[0].count) === 0;

        // Insert bank account
        const insertResult = await pgPool.query(
            `INSERT INTO bank_accounts 
        (user_id, account_name, account_number, ifsc_code, bank_name, is_primary, is_verified, created_at) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
            [pgUserId, accountName, accountNumber, ifscCode, bankName, isPrimary, false]
        );

        // Format response
        const newAccount = {
            id: insertResult.rows[0].id,
            accountName: insertResult.rows[0].account_name,
            accountNumber: insertResult.rows[0].account_number,
            ifscCode: insertResult.rows[0].ifsc_code,
            bankName: insertResult.rows[0].bank_name,
            isPrimary: insertResult.rows[0].is_primary,
            isVerified: insertResult.rows[0].is_verified,
            createdAt: insertResult.rows[0].created_at
        };

        res.status(201).json({
            success: true,
            message: 'Bank account added successfully',
            data: newAccount
        });
    } catch (error) {
        next(error);
    }
}; 
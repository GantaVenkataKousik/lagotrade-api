const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const Market = require('../models/Market');

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const {
            type,
            symbol,
            quantity,
            price,
            orderType,
            limitPrice,
            stopLoss,
            takeProfit
        } = req.body;

        // Validate market data
        const marketData = await Market.findOne({ symbol });
        if (!marketData) {
            return res.status(400).json({ message: 'Invalid symbol' });
        }

        // Create transaction
        const transaction = new Transaction({
            userId: req.user.userId,
            type,
            symbol,
            quantity,
            price,
            totalAmount: quantity * price,
            orderType,
            limitPrice,
            stopLoss,
            takeProfit,
            status: 'PENDING'
        });

        await transaction.save();

        // Update portfolio if it's a market order
        if (orderType === 'MARKET') {
            await updatePortfolio(transaction);
            transaction.status = 'COMPLETED';
            transaction.executionTime = new Date();
            await transaction.save();
        }

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user's transactions
exports.getTransactions = async (req, res) => {
    try {
        const { symbol, type, status, startDate, endDate } = req.query;
        const query = { userId: req.user.userId };

        if (symbol) query.symbol = symbol;
        if (type) query.type = type;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get transaction by ID
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel pending transaction
exports.cancelTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status !== 'PENDING') {
            return res.status(400).json({ message: 'Can only cancel pending transactions' });
        }

        transaction.status = 'CANCELLED';
        await transaction.save();

        res.json(transaction);
    } catch (error) {
        console.error('Cancel transaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to update portfolio after transaction
async function updatePortfolio(transaction) {
    const portfolio = await Portfolio.findOne({ userId: transaction.userId });
    if (!portfolio) return;

    const quantity = transaction.type === 'BUY' ? transaction.quantity : -transaction.quantity;
    await portfolio.updateAsset(transaction.symbol, quantity, transaction.price);
} 
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Market = require('../models/Market');

// Get user's portfolio
exports.getPortfolio = async (req, res) => {
    try {
        let portfolio = await Portfolio.findOne({ userId: req.user.userId });

        if (!portfolio) {
            // Create new portfolio if it doesn't exist
            portfolio = new Portfolio({
                userId: req.user.userId,
                assets: [],
                totalPortfolioValue: 0,
                cashBalance: 0
            });
            await portfolio.save();
        }

        res.json(portfolio);
    } catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update portfolio asset
exports.updateAsset = async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;
        const portfolio = await Portfolio.findOne({ userId: req.user.userId });

        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        // Find if asset exists
        const assetIndex = portfolio.assets.findIndex(a => a.symbol === symbol);

        if (assetIndex > -1) {
            // Update existing asset
            const asset = portfolio.assets[assetIndex];
            const newQuantity = asset.quantity + quantity;

            if (newQuantity <= 0) {
                // Remove asset if quantity is 0 or negative
                portfolio.assets.splice(assetIndex, 1);
            } else {
                // Update asset
                asset.quantity = newQuantity;
                asset.currentPrice = price;
                asset.totalValue = newQuantity * price;
                asset.unrealizedPnL = (price - asset.averageBuyPrice) * newQuantity;
                asset.lastUpdated = new Date();
            }
        } else if (quantity > 0) {
            // Add new asset
            portfolio.assets.push({
                symbol,
                quantity,
                averageBuyPrice: price,
                currentPrice: price,
                totalValue: quantity * price,
                unrealizedPnL: 0,
                lastUpdated: new Date()
            });
        }

        // Update total portfolio value
        portfolio.totalPortfolioValue = portfolio.assets.reduce(
            (total, asset) => total + asset.totalValue,
            portfolio.cashBalance
        );

        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get portfolio performance
exports.getPerformance = async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: req.user.userId });

        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        // Calculate performance metrics
        const performance = {
            daily: portfolio.performance.daily,
            weekly: portfolio.performance.weekly,
            monthly: portfolio.performance.monthly,
            yearly: portfolio.performance.yearly,
            riskMetrics: portfolio.riskMetrics
        };

        res.json(performance);
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update cash balance
exports.updateCashBalance = async (req, res) => {
    try {
        const { amount } = req.body;
        const portfolio = await Portfolio.findOne({ userId: req.user.userId });

        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        portfolio.cashBalance += amount;
        portfolio.totalPortfolioValue = portfolio.assets.reduce(
            (total, asset) => total + asset.totalValue,
            portfolio.cashBalance
        );

        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        console.error('Update cash balance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get portfolio summary
exports.getSummary = async (req, res) => {
    try {
        const portfolio = await Portfolio.findOne({ userId: req.user.userId });

        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }

        const summary = {
            totalPortfolioValue: portfolio.totalPortfolioValue,
            cashBalance: portfolio.cashBalance,
            totalAssets: portfolio.assets.length,
            totalInvested: portfolio.assets.reduce(
                (total, asset) => total + (asset.averageBuyPrice * asset.quantity),
                0
            ),
            totalUnrealizedPnL: portfolio.assets.reduce(
                (total, asset) => total + asset.unrealizedPnL,
                0
            )
        };

        res.json(summary);
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 
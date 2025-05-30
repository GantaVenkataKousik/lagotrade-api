const mongoose = require('mongoose');

// Schema for individual stock data
const StockDataSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        index: true
    },
    companyName: {
        type: String,
        required: true
    },
    lastPrice: {
        type: Number,
        required: true
    },
    change: {
        type: Number,
        required: true
    },
    pChange: {
        type: Number,
        required: true,
        index: true // Index for filtering by percentage change
    },
    previousClose: {
        type: Number,
        required: true
    },
    open: {
        type: Number,
        required: true
    },
    dayHigh: {
        type: Number,
        required: true
    },
    dayLow: {
        type: Number,
        required: true
    },
    totalTradedVolume: {
        type: Number,
        required: true
    },
    totalTradedValue: {
        type: Number,
        required: true
    },
    yearHigh: {
        type: Number
    },
    yearLow: {
        type: Number
    },
    marketCap: {
        type: Number
    },
    pe: {
        type: Number
    },
    pb: {
        type: Number
    },
    dividend: {
        type: Number
    },
    // Technical indicators (can be calculated later)
    rsi: {
        type: Number
    },
    sma20: {
        type: Number
    },
    sma50: {
        type: Number
    },
    ema12: {
        type: Number
    },
    ema26: {
        type: Number
    },
    // Volatility measures
    volatility: {
        type: Number
    },
    beta: {
        type: Number
    }
});

// Main market data collection schema
const MarketDataSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    marketSession: {
        type: String,
        enum: ['pre-market', 'market-hours', 'post-market', 'after-hours'],
        required: true,
        index: true
    },
    niftyIndex: {
        value: {
            type: Number,
            required: true
        },
        change: {
            type: Number,
            required: true
        },
        pChange: {
            type: Number,
            required: true
        }
    },
    totalStocks: {
        type: Number,
        required: true
    },
    gainers: {
        type: Number,
        required: true
    },
    losers: {
        type: Number,
        required: true
    },
    unchanged: {
        type: Number,
        required: true
    },
    // Individual stock data
    stocks: [StockDataSchema],

    // Market sentiment indicators
    marketSentiment: {
        type: String,
        enum: ['bullish', 'bearish', 'neutral'],
        required: true
    },

    // Volume analysis
    totalVolume: {
        type: Number,
        required: true
    },
    avgVolume: {
        type: Number,
        required: true
    },

    // Alert metadata
    alertSent: {
        type: Boolean,
        default: false
    },
    alertReason: {
        type: String,
        enum: ['significant-movement', 'scheduled', 'manual', 'error']
    },

    // Data source info
    dataSource: {
        type: String,
        default: 'NSE',
        required: true
    },
    apiResponse: {
        success: {
            type: Boolean,
            required: true
        },
        responseTime: {
            type: Number // in milliseconds
        },
        errorMessage: {
            type: String
        }
    }
}, {
    timestamps: true,
    // Create indexes for efficient querying
    indexes: [
        { timestamp: -1 },
        { marketSession: 1, timestamp: -1 },
        { 'stocks.symbol': 1, timestamp: -1 },
        { 'stocks.pChange': -1, timestamp: -1 },
        { alertSent: 1, timestamp: -1 }
    ]
});

// Static methods for AI training data preparation
MarketDataSchema.statics.getTrainingData = async function (options = {}) {
    const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate = new Date(),
        symbols = null,
        minPriceChange = null,
        marketSession = null
    } = options;

    const query = {
        timestamp: { $gte: startDate, $lte: endDate }
    };

    if (marketSession) query.marketSession = marketSession;

    const pipeline = [
        { $match: query },
        { $unwind: '$stocks' },
        ...(symbols ? [{ $match: { 'stocks.symbol': { $in: symbols } } }] : []),
        ...(minPriceChange ? [{ $match: { 'stocks.pChange': { $gte: Math.abs(minPriceChange) } } }] : []),
        {
            $project: {
                timestamp: 1,
                marketSession: 1,
                niftyIndex: 1,
                marketSentiment: 1,
                totalVolume: 1,
                symbol: '$stocks.symbol',
                lastPrice: '$stocks.lastPrice',
                change: '$stocks.change',
                pChange: '$stocks.pChange',
                volume: '$stocks.totalTradedVolume',
                high: '$stocks.dayHigh',
                low: '$stocks.dayLow',
                open: '$stocks.open',
                previousClose: '$stocks.previousClose'
            }
        },
        { $sort: { timestamp: -1 } }
    ];

    return this.aggregate(pipeline);
};

// Method to get stock performance over time
MarketDataSchema.statics.getStockTimeSeries = async function (symbol, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $unwind: '$stocks' },
        { $match: { 'stocks.symbol': symbol } },
        {
            $project: {
                timestamp: 1,
                price: '$stocks.lastPrice',
                change: '$stocks.pChange',
                volume: '$stocks.totalTradedVolume',
                high: '$stocks.dayHigh',
                low: '$stocks.dayLow'
            }
        },
        { $sort: { timestamp: 1 } }
    ]);
};

// Method to calculate market volatility
MarketDataSchema.statics.getMarketVolatility = async function (days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
            $group: {
                _id: null,
                avgChange: { $avg: '$niftyIndex.pChange' },
                stdDev: { $stdDevPop: '$niftyIndex.pChange' },
                maxChange: { $max: '$niftyIndex.pChange' },
                minChange: { $min: '$niftyIndex.pChange' },
                count: { $sum: 1 }
            }
        }
    ]);
};

// Instance methods
MarketDataSchema.methods.calculateMarketSentiment = function () {
    const gainersRatio = this.gainers / this.totalStocks;
    const losersRatio = this.losers / this.totalStocks;

    if (gainersRatio > 0.6) return 'bullish';
    if (losersRatio > 0.6) return 'bearish';
    return 'neutral';
};

MarketDataSchema.methods.getSignificantMovers = function (threshold = 2.0) {
    return {
        gainers: this.stocks.filter(stock => stock.pChange >= threshold),
        losers: this.stocks.filter(stock => stock.pChange <= -threshold)
    };
};

// Pre-save middleware to calculate derived fields
MarketDataSchema.pre('save', function (next) {
    // Calculate market sentiment
    this.marketSentiment = this.calculateMarketSentiment();

    // Calculate total volume
    this.totalVolume = this.stocks.reduce((sum, stock) => sum + stock.totalTradedVolume, 0);
    this.avgVolume = this.totalVolume / this.stocks.length;

    // Count gainers, losers, unchanged
    this.gainers = this.stocks.filter(stock => stock.pChange > 0).length;
    this.losers = this.stocks.filter(stock => stock.pChange < 0).length;
    this.unchanged = this.stocks.filter(stock => stock.pChange === 0).length;

    next();
});

const MarketData = mongoose.model('MarketData', MarketDataSchema);

module.exports = MarketData; 
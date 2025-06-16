const mongoose = require('mongoose');

const UpstoxMarketDataSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true
    },
    instrumentKey: {
        type: String,
        required: true,
        index: true
    },
    exchange: {
        type: String,
        enum: ['NSE', 'BSE', 'NFO', 'MCX'],
        required: true
    },
    ohlc: {
        open: {
            type: Number,
            required: true
        },
        high: {
            type: Number,
            required: true
        },
        low: {
            type: Number,
            required: true
        },
        close: {
            type: Number,
            required: true
        }
    },
    lastPrice: {
        type: Number,
        required: true
    },
    volume: {
        type: Number,
        default: 0
    },
    depth: {
        buy: [{
            quantity: Number,
            price: Number,
            orders: Number
        }],
        sell: [{
            quantity: Number,
            price: Number,
            orders: Number
        }]
    },
    marketData: {
        averagePrice: Number,
        totalBuyQuantity: Number,
        totalSellQuantity: Number,
        openInterest: Number,
        netChange: Number,
        percentChange: Number,
        lowerCircuitLimit: Number,
        upperCircuitLimit: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    dataSource: {
        type: String,
        default: 'Upstox'
    }
}, {
    timestamps: true,
    strict: true
});

// Compound index for efficient querying
UpstoxMarketDataSchema.index({ symbol: 1, exchange: 1, timestamp: -1 });

module.exports = mongoose.model('UpstoxMarketData', UpstoxMarketDataSchema); 
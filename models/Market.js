const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['STOCK', 'CRYPTO', 'FOREX', 'COMMODITY'],
        required: true
    },
    exchange: {
        type: String,
        required: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    priceChange: {
        value: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    },
    volume: {
        type: Number,
        default: 0
    },
    marketCap: {
        type: Number
    },
    high24h: {
        type: Number
    },
    low24h: {
        type: Number
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    metadata: {
        sector: String,
        industry: String,
        description: String,
        website: String,
        logo: String
    },
    technicalIndicators: {
        rsi: { type: Number },
        macd: { type: Number },
        movingAverages: {
            sma20: { type: Number },
            sma50: { type: Number },
            sma200: { type: Number }
        }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
marketSchema.index({ symbol: 1 });
marketSchema.index({ type: 1 });
marketSchema.index({ exchange: 1 });

const Market = mongoose.model('Market', marketSchema);

module.exports = Market; 
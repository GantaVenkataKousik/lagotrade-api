/**
 * AI Prediction Model for LagoTrade
 */

const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        uppercase: true
    },
    exchange: {
        type: String,
        required: true,
        uppercase: true
    },
    date: {
        type: Date,
        required: true
    },
    predictions: {
        '1d': {
            price: { type: Number },
            confidence: { type: Number }
        },
        '7d': {
            price: { type: Number },
            confidence: { type: Number }
        },
        '30d': {
            price: { type: Number },
            confidence: { type: Number }
        }
    },
    signals: {
        trend: {
            type: String,
            enum: ['bullish', 'bearish', 'neutral']
        },
        strength: { type: Number },
        support: [{ type: Number }],
        resistance: [{ type: Number }]
    },
    sentiment: {
        value: { type: Number },
        sources: [{ type: String }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt' }
});

// Index for faster lookups
aiPredictionSchema.index({ symbol: 1, exchange: 1, date: -1 });

module.exports = mongoose.model('AIPrediction', aiPredictionSchema); 
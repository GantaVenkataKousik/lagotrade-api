/**
 * Portfolio Model
 * 
 * This model provides methods to interact with portfolio holdings in PostgreSQL.
 */

const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assets: [{
    symbol: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    averageBuyPrice: {
      type: Number,
      required: true
    },
    currentPrice: {
      type: Number,
      required: true
    },
    totalValue: {
      type: Number,
      required: true
    },
    unrealizedPnL: {
      type: Number,
      required: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  totalPortfolioValue: {
    type: Number,
    required: true,
    default: 0
  },
  cashBalance: {
    type: Number,
    required: true,
    default: 0
  },
  performance: {
    daily: { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    yearly: { type: Number, default: 0 }
  },
  riskMetrics: {
    volatility: { type: Number, default: 0 },
    sharpeRatio: { type: Number, default: 0 },
    maxDrawdown: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for faster queries
portfolioSchema.index({ userId: 1 });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio; 
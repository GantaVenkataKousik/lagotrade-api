const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    orderType: {
        type: String,
        enum: ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'],
        required: true
    },
    limitPrice: {
        type: Number
    },
    stopLoss: {
        type: Number
    },
    takeProfit: {
        type: Number
    },
    fees: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    executionTime: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ symbol: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 
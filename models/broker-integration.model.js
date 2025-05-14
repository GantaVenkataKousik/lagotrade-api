/**
 * Broker Integration Model for LagoTrade
 */

const mongoose = require('mongoose');

const brokerIntegrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    broker: {
        type: String,
        enum: ['upstox', 'zerodha', 'angelone'],
        required: true
    },
    accessToken: {
        type: String
    },
    refreshToken: {
        type: String
    },
    tokenExpiry: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastSynced: {
        type: Date
    },
    credentials: {
        apiKey: { type: String },
        clientId: { type: String },
        userId: { type: String },
        otherDetails: { type: mongoose.Schema.Types.Mixed }
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Token refresh method
brokerIntegrationSchema.methods.refreshBrokerToken = async function () {
    // TODO: Implement broker-specific token refresh logic
    return false;
};

// Check if token is valid
brokerIntegrationSchema.methods.isTokenValid = function () {
    if (!this.tokenExpiry) return false;

    // Check if token has expired (with 5-minute buffer)
    const now = new Date();
    const expiryWithBuffer = new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000);

    return now < expiryWithBuffer;
};

module.exports = mongoose.model('BrokerIntegration', brokerIntegrationSchema); 
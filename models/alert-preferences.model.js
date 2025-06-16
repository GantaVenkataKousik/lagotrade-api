const mongoose = require('mongoose');

const AlertPreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    frequency: {
        type: String,
        enum: ['1min', '5min', '15min', '30min', '1hour', 'daily'],
        default: '5min'
    },
    marketAlerts: {
        type: Boolean,
        default: true
    },
    priceAlerts: {
        type: Boolean,
        default: true
    },
    volumeAlerts: {
        type: Boolean,
        default: false
    },
    technicalAlerts: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure unique userId
AlertPreferencesSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('AlertPreferences', AlertPreferencesSchema); 
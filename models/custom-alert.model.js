const mongoose = require('mongoose');

const CustomAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    condition: {
        type: String,
        enum: ['above', 'below', 'cross', 'volume_above', 'volume_below'],
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    frequency: {
        type: String,
        enum: ['1min', '5min', '15min', '30min', '1hour', 'daily'],
        default: '5min'
    },
    active: {
        type: Boolean,
        default: true
    },
    lastTriggered: {
        type: Date
    },
    triggerCount: {
        type: Number,
        default: 0
    },
    alertType: {
        type: String,
        enum: ['price', 'volume', 'technical'],
        default: 'price'
    },
    notificationChannels: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        whatsapp: {
            type: Boolean,
            default: false
        }
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

// Compound index for efficient querying
CustomAlertSchema.index({ userId: 1, symbol: 1, active: 1 });

module.exports = mongoose.model('CustomAlert', CustomAlertSchema); 
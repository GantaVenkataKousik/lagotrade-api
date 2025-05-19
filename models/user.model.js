/**
 * User Model for LagoTrade
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    mobileVerification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        otp: String,
        otpExpiry: Date,
        verificationAttempts: {
            type: Number,
            default: 0
        },
        lastVerificationAttempt: Date
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    preferences: {
        theme: {
            type: String,
            default: 'light'
        },
        defaultView: {
            type: String,
            default: 'dashboard'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
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
        }
    },
    isVerified: {
        type: Boolean,
        default: true
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    onboardingStatus: {
        type: String,
        enum: ['new', 'mobile_pending', 'broker_pending', 'kyc_pending', 'complete'],
        default: 'new'
    },
    brokerIntegration: {
        isConnected: {
            type: Boolean,
            default: false
        },
        broker: {
            type: String,
            enum: ['upstox', 'zerodha', 'angel', 'other'],
            default: null
        },
        accountId: String,
        lastSynced: Date
    },
    resetPasswordOTP: String,
    resetPasswordExpiry: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
    try {
        // Safety check if password is missing
        if (!this.password) {
            console.error('User has no password field:', this._id);
            return false;
        }

        // Use a timeout to prevent hanging
        return await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error('Password comparison timeout');
                resolve(false);
            }, 3000);

            bcrypt.compare(enteredPassword, this.password)
                .then(result => {
                    clearTimeout(timeout);
                    resolve(result);
                })
                .catch(err => {
                    clearTimeout(timeout);
                    console.error('Password comparison error:', err);
                    resolve(false);
                });
        });
    } catch (error) {
        console.error('Error in comparePassword:', error);
        return false;
    }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET || 'fallback_jwt_secret_value_for_development',
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_token_secret_for_development',
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
    );
};

// Check if mobile number is verified
userSchema.methods.isMobileVerified = function () {
    return this.mobileVerification && this.mobileVerification.isVerified;
};

// Generate mobile verification OTP
userSchema.methods.generateMobileVerificationOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    this.mobileVerification = {
        ...this.mobileVerification,
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        verificationAttempts: 0,
        lastVerificationAttempt: new Date()
    };
    return otp;
};

// Check onboarding status
userSchema.methods.getOnboardingRequirements = function () {
    const requirements = [];

    // Check mobile verification
    if (!this.mobileVerification || !this.mobileVerification.isVerified) {
        requirements.push('mobile_verification');
    }

    // Check broker integration
    if (!this.brokerIntegration || !this.brokerIntegration.isConnected) {
        requirements.push('broker_integration');
    }

    return requirements;
};

module.exports = mongoose.model('User', userSchema); 
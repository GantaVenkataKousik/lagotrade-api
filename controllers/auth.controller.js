/**
 * Authentication Controller for LagoTrade API
 */

const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email.utils');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        console.log('Register attempt:', { name, email, phone });

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error(`MongoDB not fully connected (state: ${mongoose.connection.readyState}). Returning error.`);
            return res.status(500).json({
                success: false,
                message: 'Database connection unavailable',
                error: 'Cannot establish database connection. Please try again later.'
            });
        }

        // Create a promise with timeout for finding existing user
        const findExistingUserWithTimeout = async () => {
            return new Promise(async (resolve, reject) => {
                // Set a timeout
                const timeout = setTimeout(() => {
                    reject(new Error('User lookup timed out after 5000ms'));
                }, 5000);

                try {
                    // Try to find existing user using Mongoose first
                    let existingUser = null;

                    try {
                        existingUser = await User.findOne({ email });
                    } catch (mongooseError) {
                        console.error('Mongoose findOne error during registration:', mongooseError);

                        // If Mongoose fails, try using native MongoDB client as backup
                        if (global.mongoClient) {
                            try {
                                const db = global.mongoClient.db();
                                existingUser = await db.collection('users').findOne({ email });
                            } catch (nativeError) {
                                console.error('Native MongoDB findOne error during registration:', nativeError);
                            }
                        }
                    }

                    clearTimeout(timeout);
                    resolve(existingUser);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        };

        // Create a promise with timeout for creating a new user
        const createUserWithTimeout = async (userData) => {
            return new Promise(async (resolve, reject) => {
                // Set a timeout
                const timeout = setTimeout(() => {
                    reject(new Error('User creation timed out after 8000ms'));
                }, 8000);

                try {
                    let newUser = null;

                    // Try to create user with Mongoose
                    try {
                        newUser = await User.create(userData);
                    } catch (mongooseError) {
                        console.error('Mongoose create error during registration:', mongooseError);

                        // If Mongoose fails, try using native MongoDB client
                        if (global.mongoClient) {
                            try {
                                const db = global.mongoClient.db();

                                // Hash the password manually since we're bypassing Mongoose pre-save hooks
                                const salt = await bcrypt.genSalt(10);
                                const hashedPassword = await bcrypt.hash(userData.password, salt);

                                const userDoc = {
                                    ...userData,
                                    password: hashedPassword,
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                };

                                const result = await db.collection('users').insertOne(userDoc);
                                if (result.insertedId) {
                                    // Convert to Mongoose model
                                    userDoc._id = result.insertedId;
                                    newUser = new User(userDoc);
                                }
                            } catch (nativeError) {
                                console.error('Native MongoDB insertOne error during registration:', nativeError);
                            }
                        }
                    }

                    clearTimeout(timeout);
                    resolve(newUser);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        };

        try {
            // Check if user exists with timeout protection
            const existingUser = await findExistingUserWithTimeout();

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create new user with timeout protection
            const newUser = await createUserWithTimeout({
                name,
                email,
                password,
                phone
            });

            if (!newUser) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user account',
                    error: 'Database operation failed'
                });
            }

            // Generate tokens
            const accessToken = newUser.generateAuthToken();
            const refreshToken = newUser.generateRefreshToken();

            // Send response
            return sendTokenResponse(newUser, accessToken, refreshToken, 201, res);
        } catch (timeoutError) {
            console.error('Registration timeout error:', timeoutError);
            return res.status(503).json({
                success: false,
                message: 'Failed to create user',
                error: timeoutError.message
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// Verify email with OTP
exports.verifyEmail = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID and OTP'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check if OTP matches and is not expired
        if (!user.verification ||
            user.verification.otp !== otp ||
            Date.now() > user.verification.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Verify user
        user.isVerified = true;
        user.verification = undefined; // Clear OTP data
        await user.save();

        // Generate tokens
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();

        // Send response
        sendTokenResponse(user, accessToken, refreshToken, 200, res);
    } catch (error) {
        next(error);
    }
};

// Resend OTP for verification
exports.resendOTP = async (req, res, next) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide user ID'
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new OTP
        const verificationOTP = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Update user with new OTP
        user.verification = {
            otp: verificationOTP,
            otpExpiry
        };
        await user.save();

        // Send verification email
        const emailSent = await sendEmail({
            to: user.email,
            subject: 'LagoTrade - Email Verification (Resend)',
            text: `Your new verification code is ${verificationOTP}. It will expire in 10 minutes.`,
            html: `
                <h2>LagoTrade Email Verification</h2>
                <p>Your new verification code is: <strong>${verificationOTP}</strong></p>
                <p>This code will expire in 10 minutes.</p>
            `
        });

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Error sending verification email'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification OTP resent successfully'
        });
    } catch (error) {
        next(error);
    }
};

// User login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', { email });

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error(`MongoDB not fully connected (state: ${mongoose.connection.readyState}). Returning error.`);
            return res.status(500).json({
                success: false,
                message: 'Database connection unavailable',
                error: 'Cannot establish database connection. Please try again later.'
            });
        }

        // Create a promise with timeout for finding the user
        const findUserWithTimeout = async () => {
            return new Promise(async (resolve, reject) => {
                // Set a timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Operation timed out after 5000ms'));
                }, 5000);

                try {
                    // Try to find user using native MongoDB client if available (as backup)
                    let user = null;

                    // Try Mongoose first
                    try {
                        user = await User.findOne({ email });
                    } catch (mongooseError) {
                        console.error('Mongoose findOne error:', mongooseError);

                        // If Mongoose fails, try using native MongoDB client
                        if (global.mongoClient) {
                            try {
                                const db = global.mongoClient.db();
                                const userDoc = await db.collection('users').findOne({ email });

                                if (userDoc) {
                                    // Convert to Mongoose model if possible
                                    user = new User(userDoc);
                                }
                            } catch (nativeError) {
                                console.error('Native MongoDB findOne error:', nativeError);
                            }
                        }
                    }

                    clearTimeout(timeout);
                    resolve(user);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        };

        try {
            // Find user with timeout protection
            const user = await findUserWithTimeout();

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check password
            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Update last login time
            user.lastLogin = Date.now();
            await user.save();

            // Generate tokens
            const accessToken = user.generateAuthToken();
            const refreshToken = user.generateRefreshToken();

            // Send response
            sendTokenResponse(user, accessToken, refreshToken, 200, res);
        } catch (timeoutError) {
            console.error('Login timeout error:', timeoutError);
            return res.status(503).json({
                success: false,
                message: 'Login service temporarily unavailable',
                error: timeoutError.message
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// Google login/signup
exports.googleAuth = async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Google ID token is required'
            });
        }

        // Verify Google token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture: avatar } = payload;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            user = await User.create({
                email,
                name,
                avatar,
                password: crypto.randomBytes(20).toString('hex'), // Random password
                isVerified: true, // Auto-verify Google users
                authProvider: 'google'
            });
        } else if (user.authProvider !== 'google') {
            // Update auth provider if user already exists but used email/password before
            user.authProvider = 'google';
            await user.save();
        }

        // Update last login time
        user.lastLogin = Date.now();
        await user.save();

        // Generate tokens
        const accessToken = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();

        // Send response
        sendTokenResponse(user, accessToken, refreshToken, 200, res);
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Google authentication failed'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your email address'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Generate reset OTP
        const resetOTP = crypto.randomInt(100000, 999999).toString();
        const resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Save to user
        user.resetPasswordOTP = resetOTP;
        user.resetPasswordExpiry = resetOTPExpiry;
        await user.save();

        // Send email
        const emailSent = await sendEmail({
            to: email,
            subject: 'LagoTrade - Password Reset',
            text: `Your password reset code is ${resetOTP}. It will expire in 10 minutes.`,
            html: `
                <h2>LagoTrade Password Reset</h2>
                <p>Your password reset code is: <strong>${resetOTP}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Error sending reset email'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset instructions sent to email'
        });
    } catch (error) {
        next(error);
    }
};

// Reset password with OTP
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, OTP, and new password'
            });
        }

        // Find user
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        next(error);
    }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Get user from database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const accessToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();

        res.status(200).json({
            success: true,
            tokens: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired, please login again'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        next(error);
    }
};

// Helper function to send token response
const sendTokenResponse = (user, accessToken, refreshToken, statusCode, res) => {
    // Create user object without password
    const userObj = {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        authProvider: user.authProvider
    };

    res.status(statusCode).json({
        success: true,
        message: statusCode === 201 ? 'Registration successful' : 'Login successful',
        tokens: {
            accessToken,
            refreshToken
        },
        user: userObj
    });
}; 
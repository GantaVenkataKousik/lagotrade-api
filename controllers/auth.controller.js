/**
 * Authentication Controller for LagoTrade API
 */

const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email.utils');

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        console.log('Register attempt:', { name, email, phone });

        // Check if user already exists in MongoDB
        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
        } catch (err) {
            console.log('MongoDB user check error:', err);
            // Continue even if MongoDB check fails
        }

        // Create new user
        try {
            const newUser = await User.create({
                name,
                email,
                password,
                phone
            });

            // Generate tokens
            const accessToken = newUser.generateAuthToken();
            const refreshToken = newUser.generateRefreshToken();

            // Send response
            return sendTokenResponse(newUser, accessToken, refreshToken, 201, res);
        } catch (err) {
            console.error('Error creating user:', err);
            return res.status(400).json({
                success: false,
                message: 'Failed to create user',
                error: err.message
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

        // Check if user exists
        const user = await User.findOne({ email });
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
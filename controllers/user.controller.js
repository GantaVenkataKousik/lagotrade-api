/**
 * User Controller for LagoTrade API
 */

const User = require('../models/user.model');
const BrokerIntegration = require('../models/broker-integration.model');
const { sendSMS } = require('../utils/whatsapp.utils');

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
    try {
        // req.user is already attached from the auth middleware
        const user = req.user;

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            preferences: user.preferences,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });
    } catch (error) {
        next(error);
    }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
    try {
        const allowedUpdates = ['name', 'phone', 'avatar', 'preferences'];
        const updates = {};

        // Filter only allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // If updating preferences, merge with existing preferences
        if (updates.preferences) {
            updates.preferences = {
                ...req.user.preferences,
                ...updates.preferences
            };
        }

        // Set updatedAt timestamp
        updates.updatedAt = Date.now();

        // Find user and update
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                preferences: updatedUser.preferences
            }
        });
    } catch (error) {
        next(error);
    }
};

// Change password
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id);

        // Check if current password matches
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        user.updatedAt = Date.now();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Delete user account
exports.deleteAccount = async (req, res, next) => {
    try {
        // First, verify password to ensure it's the user
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your password to confirm account deletion'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id);

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Password is incorrect'
            });
        }

        // Delete user
        await User.findByIdAndDelete(req.user._id);

        // TODO: Delete user data from PostgreSQL and related records

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user profile
 * @route GET /api/users/me
 */
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get onboarding requirements
        const requirements = user.getOnboardingRequirements();

        // Check broker integration
        const brokerIntegration = await BrokerIntegration.findOne({ userId: user._id, isActive: true });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    isVerified: user.isVerified,
                    role: user.role,
                    createdAt: user.createdAt,
                    preferences: user.preferences,
                    mobileVerified: user.mobileVerification?.isVerified || false,
                    brokerIntegrated: !!brokerIntegration,
                    brokerName: brokerIntegration?.broker || null,
                    onboardingStatus: user.onboardingStatus,
                    onboardingRequirements: requirements,
                    showDummyData: requirements.length > 0
                }
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Send mobile verification OTP
 * @route POST /api/users/verify-mobile/send
 */
exports.sendMobileVerificationOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update phone if provided
        if (phone !== user.phone) {
            user.phone = phone;
        }

        // Check if already verified
        if (user.mobileVerification && user.mobileVerification.isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is already verified'
            });
        }

        // Generate OTP
        const otp = user.generateMobileVerificationOTP();
        await user.save();

        // Send OTP via SMS
        try {
            await sendSMS(phone, `Your LagoTrade verification code is: ${otp}. Valid for 10 minutes.`);
        } catch (smsError) {
            console.error('Error sending SMS:', smsError);
            // Don't fail the request if SMS fails
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent successfully',
            data: {
                phoneNumber: maskPhoneNumber(phone),
                expiresIn: '10 minutes'
            }
        });
    } catch (error) {
        console.error('Send mobile verification OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Verify mobile OTP
 * @route POST /api/users/verify-mobile/verify
 */
exports.verifyMobileOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                error: 'OTP is required'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if already verified
        if (user.mobileVerification && user.mobileVerification.isVerified) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is already verified'
            });
        }

        // Check if OTP exists and is not expired
        if (!user.mobileVerification ||
            !user.mobileVerification.otp ||
            !user.mobileVerification.otpExpiry ||
            new Date() > user.mobileVerification.otpExpiry) {
            return res.status(400).json({
                success: false,
                error: 'OTP has expired or is invalid'
            });
        }

        // Verify OTP
        if (user.mobileVerification.otp !== otp) {
            // Increment attempts
            user.mobileVerification.verificationAttempts = (user.mobileVerification.verificationAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                success: false,
                error: 'Invalid OTP'
            });
        }

        // Mark as verified
        user.mobileVerification.isVerified = true;
        user.mobileVerification.otp = undefined;
        user.mobileVerification.otpExpiry = undefined;

        // Update onboarding status
        if (user.onboardingStatus === 'new' || user.onboardingStatus === 'mobile_pending') {
            user.onboardingStatus = 'broker_pending';
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Phone number verified successfully',
            data: {
                mobileVerified: true,
                onboardingStatus: user.onboardingStatus,
                onboardingRequirements: user.getOnboardingRequirements()
            }
        });
    } catch (error) {
        console.error('Verify mobile OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Get user onboarding status
 * @route GET /api/users/onboarding-status
 */
exports.getOnboardingStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get onboarding requirements
        const requirements = user.getOnboardingRequirements();

        // Check broker integration
        const brokerIntegration = await BrokerIntegration.findOne({ userId: user._id, isActive: true });

        res.status(200).json({
            success: true,
            data: {
                status: user.onboardingStatus,
                requirements,
                mobileVerified: user.mobileVerification?.isVerified || false,
                brokerIntegrated: !!brokerIntegration,
                brokerName: brokerIntegration?.broker || null,
                showDummyData: requirements.length > 0
            }
        });
    } catch (error) {
        console.error('Get onboarding status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Check if user should see real or dummy data
 * @route GET /api/users/data-status
 */
exports.getDataStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get onboarding requirements
        const requirements = user.getOnboardingRequirements();

        // User sees dummy data if they haven't completed onboarding
        const showDummyData = requirements.length > 0;

        res.status(200).json({
            success: true,
            data: {
                showDummyData,
                requirements
            }
        });
    } catch (error) {
        console.error('Get data status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// Helper function to mask phone number
function maskPhoneNumber(phone) {
    if (!phone) return '';
    return phone.slice(0, 4) + '****' + phone.slice(-3);
} 
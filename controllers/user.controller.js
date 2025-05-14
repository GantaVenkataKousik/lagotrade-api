/**
 * User Controller for LagoTrade API
 */

const User = require('../models/user.model');

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
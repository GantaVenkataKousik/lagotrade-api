const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post(
    '/register',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
        check('name', 'Name is required').not().isEmpty()
    ],
    userController.register
);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    userController.login
);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, userController.updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put(
    '/password',
    [
        auth,
        check('currentPassword', 'Current password is required').exists(),
        check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
    ],
    userController.changePassword
);

module.exports = router; 
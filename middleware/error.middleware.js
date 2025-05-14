/**
 * Error handling middleware for LagoTrade API
 */

// Error response handler
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = {};
        Object.keys(err.errors).forEach(key => {
            errors[key] = err.errors[key].message;
        });
        message = 'Validation Error';
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }

    // Handle Mongoose cast errors (invalid IDs)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate entry found';
        const field = Object.keys(err.keyValue)[0];
        return res.status(statusCode).json({
            success: false,
            message: `${field} already exists`,
            field
        });
    }

    // Generic error response
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
};

module.exports = { errorHandler }; 
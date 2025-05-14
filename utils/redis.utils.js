/**
 * Redis utilities for LagoTrade API
 */

const Redis = require('ioredis');

/**
 * Initialize Redis database with initial keys
 * @param {object} redisClient - Connected Redis client
 * @returns {Promise<void>}
 */
exports.initializeRedis = async (redisClient) => {
    try {
        console.log('Initializing Redis...');

        // Check if Redis client is connected
        if (!redisClient) {
            console.error('Redis client not provided');
            return;
        }

        // Set some initial configuration
        await redisClient.set('app:version', '1.0.0');
        await redisClient.set('app:name', 'LagoTrade');

        // Create a test hash
        await redisClient.hset('app:config', 'maintenance_mode', 'false');
        await redisClient.hset('app:config', 'max_rate_limit', '100');

        // Set expiration for rate limiting (example)
        await redisClient.set('rate_limit:template', '10');
        await redisClient.expire('rate_limit:template', 60); // 1 minute

        console.log('✅ Redis initialized successfully');
    } catch (error) {
        console.error('Error initializing Redis:', error);
    }
};

/**
 * Store a user session in Redis
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @param {number} expiryInSeconds - Token expiry in seconds
 * @returns {Promise<boolean>} - Success status
 */
exports.storeUserSession = async (redisClient, userId, token, expiryInSeconds = 3600) => {
    try {
        if (!redisClient) return false;

        // Store the session with expiry
        await redisClient.set(`session:${userId}`, token, 'EX', expiryInSeconds);
        return true;
    } catch (error) {
        console.error('Error storing user session:', error);
        return false;
    }
};

/**
 * Get user session from Redis
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} - Token or null if not found
 */
exports.getUserSession = async (redisClient, userId) => {
    try {
        if (!redisClient) return null;

        // Get the session
        return await redisClient.get(`session:${userId}`);
    } catch (error) {
        console.error('Error getting user session:', error);
        return null;
    }
};

/**
 * Remove user session from Redis
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
exports.removeUserSession = async (redisClient, userId) => {
    try {
        if (!redisClient) return false;

        // Remove the session
        await redisClient.del(`session:${userId}`);
        return true;
    } catch (error) {
        console.error('Error removing user session:', error);
        return false;
    }
}; 
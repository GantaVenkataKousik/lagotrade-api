/**
 * MongoDB utilities for LagoTrade API
 */

const mongoose = require('mongoose');

/**
 * Create indexes for collections
 * @returns {Promise<void>}
 */
exports.createMongoIndexes = async () => {
    try {
        console.log('Creating MongoDB indexes...');

        // Create indexes for User model
        await mongoose.model('User').createIndexes();

        // Create indexes for other models as needed
        // e.g., await mongoose.model('Portfolio').createIndexes();

        console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
        console.error('Error creating MongoDB indexes:', error);
    }
};

/**
 * Simple MongoDB health check
 * @returns {Promise<boolean>} Connection status
 */
exports.checkMongoConnection = async () => {
    try {
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.ping();
        return result.ok === 1;
    } catch (error) {
        console.error('MongoDB health check failed:', error);
        return false;
    }
};

/**
 * Cache data in MongoDB (instead of Redis)
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiryInSeconds - Expiry time in seconds
 * @returns {Promise<boolean>} Success status
 */
exports.setCache = async (key, data, expiryInSeconds = 3600) => {
    try {
        const Cache = mongoose.model('Cache') || mongoose.model('Cache', new mongoose.Schema({
            key: { type: String, required: true, unique: true },
            data: { type: mongoose.Schema.Types.Mixed, required: true },
            createdAt: { type: Date, default: Date.now, expires: expiryInSeconds }
        }));

        await Cache.findOneAndUpdate(
            { key },
            { key, data, createdAt: new Date() },
            { upsert: true, new: true }
        );

        return true;
    } catch (error) {
        console.error('MongoDB cache error:', error);
        return false;
    }
};

/**
 * Get cached data from MongoDB
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
exports.getCache = async (key) => {
    try {
        const Cache = mongoose.model('Cache') || mongoose.model('Cache', new mongoose.Schema({
            key: { type: String, required: true, unique: true },
            data: { type: mongoose.Schema.Types.Mixed, required: true },
            createdAt: { type: Date, default: Date.now }
        }));

        const cached = await Cache.findOne({ key });
        return cached ? cached.data : null;
    } catch (error) {
        console.error('MongoDB cache error:', error);
        return null;
    }
};

/**
 * Delete cached data from MongoDB
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
exports.deleteCache = async (key) => {
    try {
        const Cache = mongoose.model('Cache') || mongoose.model('Cache', new mongoose.Schema({
            key: { type: String, required: true, unique: true },
            data: { type: mongoose.Schema.Types.Mixed, required: true },
            createdAt: { type: Date, default: Date.now }
        }));

        await Cache.deleteOne({ key });
        return true;
    } catch (error) {
        console.error('MongoDB cache error:', error);
        return false;
    }
}; 
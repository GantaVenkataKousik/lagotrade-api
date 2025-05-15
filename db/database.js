const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connection state tracking
let isConnected = false;
let nativeClient = null;

// Connection options with appropriate timeouts for serverless
const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    bufferCommands: false,
};

/**
 * Connects to MongoDB using both mongoose and native driver
 */
const connect = async () => {
    if (isConnected) {
        console.log('MongoDB connection already established');
        return { isConnected, nativeClient };
    }

    try {
        // Connect using Mongoose
        await mongoose.connect(process.env.MONGO_URI, connectionOptions);

        // Also connect with native driver for more control
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();

        // Test connection
        await client.db('admin').command({ ping: 1 });

        console.log('✅ MongoDB connected successfully');

        // Store connection state
        isConnected = true;
        nativeClient = client;

        // Initialize database
        await initializeDatabase(client);

        return { isConnected, nativeClient };
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        isConnected = false;
        return { isConnected: false, nativeClient: null };
    }
};

/**
 * Initialize database collections and indexes
 */
const initializeDatabase = async (client) => {
    try {
        const db = client.db('trade');

        // Get existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // Create users collection if needed
        if (!collectionNames.includes('users')) {
            await db.createCollection('users');
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            console.log('Created users collection with email index');
        }

        console.log('Database initialization completed');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        return false;
    }
};

/**
 * Middleware to ensure DB connection for each request
 */
const ensureConnection = async (req, res, next) => {
    // Skip for health check
    if (req.path === '/api/health') return next();

    // If already connected proceed
    if (isConnected && mongoose.connection.readyState === 1) return next();

    // Try to connect
    const { isConnected: connected } = await connect();

    if (connected) {
        next();
    } else {
        res.status(500).json({
            success: false,
            message: 'Database connection unavailable',
            error: 'Cannot establish database connection. Please try again later.'
        });
    }
};

// Setup connection event listeners
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    isConnected = false;
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    isConnected = false;
});

// Handle application termination
process.on('SIGINT', async () => {
    if (nativeClient) {
        await nativeClient.close();
    }
    await mongoose.connection.close();
    console.log('MongoDB connections closed due to app termination');
    process.exit(0);
});

module.exports = {
    connect,
    ensureConnection,
    isConnected: () => isConnected,
    getClient: () => nativeClient
}; 
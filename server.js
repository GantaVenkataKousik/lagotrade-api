const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const marketRoutes = require('./routes/market.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const orderRoutes = require('./routes/order.routes');
const tradingRoutes = require('./routes/trading.routes');
const aiPredictorRoutes = require('./routes/ai-predictor.routes');
const autoTradingRoutes = require('./routes/auto-trading.routes');
const brokerRoutes = require('./routes/broker.routes');
const communityRoutes = require('./routes/community.routes');
const learnRoutes = require('./routes/learn.routes');
const notificationRoutes = require('./routes/notification.routes');
const riskManagementRoutes = require('./routes/risk-management.routes');
const developerRoutes = require('./routes/developer.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Updated CORS configuration for production and development
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://lagotrade.vercel.app', 'https://www.lagotrade.vercel.app']
        : 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// For preflight requests
app.options('*', cors(corsOptions));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Disable Mongoose buffering globally - IMPORTANT: This must be done before creating a connection
mongoose.set('bufferCommands', false);
mongoose.set('autoIndex', false);
mongoose.set('strictQuery', true);

// Set Mongoose options with much higher timeouts
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    // Disable buffering for serverless environment
    bufferCommands: false
};

// Database connection - MongoDB only
let isMongoConnected = false;
let mongoConnectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Connection string for MongoDB Atlas
const MONGO_URI = "mongodb+srv://gvk:gvk123@gvk.orbwd1t.mongodb.net/trade?retryWrites=true&w=majority&appName=gvk";

// Add this function to initialize the database with required collections
const initializeDatabase = async () => {
    try {
        if (!global.mongoClient) {
            console.error('Cannot initialize database - MongoDB client not available');
            return false;
        }

        const db = global.mongoClient.db('trade');

        // Get list of existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // Create users collection if it doesn't exist
        if (!collectionNames.includes('users')) {
            await db.createCollection('users');
            console.log('Created users collection');

            // Create index on email for faster lookups and to enforce uniqueness
            await db.collection('users').createIndex({ email: 1 }, { unique: true });
            console.log('Created unique index on email field in users collection');
        }

        console.log('Database initialization completed successfully');
        return true;
    } catch (err) {
        console.error('Error initializing database:', err);
        return false;
    }
};

// Updated connectWithRetry function
const connectWithRetry = async () => {
    // Don't attempt to reconnect if already connected
    if (isMongoConnected) {
        console.log('MongoDB already connected, skipping connection attempt');
        return true;
    }

    // Check if we've exceeded max attempts
    if (mongoConnectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.error(`Failed to connect to MongoDB after ${MAX_CONNECTION_ATTEMPTS} attempts`);
        return false;
    }

    mongoConnectionAttempts++;
    console.log(`MongoDB connection attempt ${mongoConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);

    try {
        // Create MongoDB native client
        const client = new MongoClient(MONGO_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        // Connect using the MongoDB native driver
        await client.connect();

        // Test connection with a ping
        await client.db("admin").command({ ping: 1 });
        console.log("✅ MongoDB connected successfully to Atlas cluster!");

        // Store the client for reuse
        global.mongoClient = client;

        // Initialize the database
        await initializeDatabase();

        // Connect mongoose to the same URI with our options
        await mongoose.connect(MONGO_URI, mongooseOptions);

        isMongoConnected = true;
        mongoConnectionAttempts = 0; // Reset counter on successful connection
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        isMongoConnected = false;

        // Only retry if we haven't exceeded max attempts
        if (mongoConnectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            console.log(`Will retry MongoDB connection in 2 seconds (attempt ${mongoConnectionAttempts}/${MAX_CONNECTION_ATTEMPTS})...`);
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            return connectWithRetry(); // Recursive retry
        } else {
            return false;
        }
    }
};

// Add middleware to ensure MongoDB is connected
const ensureMongoConnected = async (req, res, next) => {
    // Skip for health check to avoid infinite loops
    if (req.path === '/api/health') {
        return next();
    }

    // If MongoDB is already connected via Mongoose, proceed
    if (isMongoConnected && mongoose.connection.readyState === 1) {
        return next();
    }

    // If we have a native client but Mongoose is not connected, that's still okay for many operations
    if (global.mongoClient) {
        try {
            // Try a quick ping to verify the native client is still connected
            await global.mongoClient.db('admin').command({ ping: 1 });
            console.log('MongoDB native client connected, proceeding with request despite Mongoose state:', mongoose.connection.readyState);

            // Set a flag on the request to indicate that we should prefer native client operations
            req.useNativeClient = true;

            return next();
        } catch (err) {
            console.error('MongoDB native client ping failed:', err);
        }
    }

    // Otherwise, try to connect
    console.log(`MongoDB not connected (state: ${mongoose.connection.readyState}), connecting before proceeding...`);
    const connected = await connectWithRetry();

    // Check connection status
    if (connected || global.mongoClient) {
        console.log('MongoDB connected successfully, proceeding with request');
        next();
    } else {
        console.error('MongoDB connection failed, returning error');
        res.status(500).json({
            success: false,
            message: 'Database connection unavailable',
            error: 'Cannot establish database connection. Please try again later.'
        });
    }
};

// Apply the connection middleware to all API routes
app.use('/api', ensureMongoConnected);

// Add health check route
app.get('/api/health', (req, res) => {
    const status = {
        status: 'ok',
        mongo: isMongoConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };
    res.json(status);
});

// Make server startup await MongoDB connection
const startServer = async () => {
    // First try to connect to MongoDB
    const isConnected = await connectWithRetry();

    if (!isConnected && process.env.NODE_ENV === 'production') {
        console.error('Failed to connect to MongoDB. Starting server anyway in production mode.');
    } else if (!isConnected) {
        console.error('Failed to connect to MongoDB. Exiting.');
        process.exit(1);
    }

    // Start server only after attempting MongoDB connection
    if (process.env.NODE_ENV !== 'production') {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } else {
        // In production (Vercel), we don't need to explicitly call listen
        console.log('Server ready to handle requests in serverless mode');
    }
};

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/markets', marketRoutes); // Some endpoints may be public
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/ai-predictor', authMiddleware, aiPredictorRoutes);
app.use('/api/auto-trading', authMiddleware, autoTradingRoutes);
app.use('/api/brokers', authMiddleware, brokerRoutes);
app.use('/api/community', authMiddleware, communityRoutes);
app.use('/api/learn', learnRoutes); // Some endpoints may be public
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/risk-management', authMiddleware, riskManagementRoutes);
app.use('/api/developer', authMiddleware, developerRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Default route
app.get('/', (req, res) => {
    const mongoStatus = isMongoConnected ?
        '<div class="status connected">MongoDB Connected</div>' :
        '<div class="status disconnected">MongoDB Disconnected</div>';

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LagoTrade API</title>
        <style>
            body {
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #1e3c72, #2a5298);
                height: 100vh;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 800px;
            }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #00d2ff, #3a7bd5);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p {
                font-size: 1.2rem;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .endpoints {
                text-align: left;
                background: rgba(0, 0, 0, 0.2);
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }
            .endpoints ul {
                columns: 2;
                column-gap: 40px;
            }
            .status {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                margin-top: 20px;
            }
            .connected {
                background: #4caf50;
                color: white;
            }
            .disconnected {
                background: #f44336;
                color: white;
            }
            .logo {
                font-size: 3.5rem;
                margin-bottom: 0;
            }
            .version {
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 0.8rem;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🌊</div>
            <h1>Welcome to LagoTrade API</h1>
            <p>Modern trading platform with AI predictions and automated trading capabilities</p>
            ${mongoStatus}
            <div class="endpoints">
                <p>Available API endpoints:</p>
                <ul>
                    <li>/api/auth</li>
                    <li>/api/users</li>
                    <li>/api/markets</li>
                    <li>/api/portfolio</li>
                    <li>/api/orders</li>
                    <li>/api/trading</li>
                    <li>/api/ai-predictor</li>
                    <li>/api/auto-trading</li>
                    <li>/api/brokers</li>
                    <li>/api/community</li>
                    <li>/api/learn</li>
                    <li>/api/notifications</li>
                    <li>/api/risk-management</li>
                    <li>/api/developer</li>
                    <li>/api/analytics</li>
                </ul>
            </div>
        </div>
        <div class="version">v1.0.0</div>
    </body>
    </html>
    `);
});

// Error handling middleware
app.use(errorHandler);

// Start the server
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Don't exit in production, just log
    // process.exit(1);
});

// For Vercel serverless deployment
module.exports = app; 
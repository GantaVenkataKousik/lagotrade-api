const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');

// Import database connection
const database = require('./db/database');

// Import market alert service (starts cron jobs automatically)
require('./services/market-alert.service');

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
const whatsappRoutes = require('./routes/whatsapp.routes');
const aiTrainingRoutes = require('./routes/ai-training.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { authMiddleware } = require('./middleware/auth.middleware');

// Initialize app
const app = express();
const PORT = config.server.port || 5000;

// Updated CORS configuration
const corsOptions = {
    origin: config.server.env === 'production'
        ? ['https://lagotrade.vercel.app', 'https://www.lagotrade.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply database connection middleware to all API routes
app.use('/api', database.ensureConnection);

// Add health check route
app.get('/api/health', (req, res) => {
    const status = {
        status: 'ok',
        mongo: database.isConnected() ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: config.server.env || 'development'
    };
    res.json(status);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/portfolio', authMiddleware, portfolioRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/ai-predictor', authMiddleware, aiPredictorRoutes);
app.use('/api/auto-trading', authMiddleware, autoTradingRoutes);
app.use('/api/brokers', authMiddleware, brokerRoutes);
app.use('/api/community', authMiddleware, communityRoutes);
app.use('/api/learn', learnRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/risk-management', authMiddleware, riskManagementRoutes);
app.use('/api/developer', authMiddleware, developerRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/ai-training', aiTrainingRoutes);

// Default route
app.get('/', (req, res) => {
    const mongoStatus = database.isConnected() ?
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
                    <li>/api/whatsapp</li>
                    <li>/api/ai-training</li>
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

// Start server function
const startServer = async () => {
    try {
        // Connect to MongoDB
        await database.connect(config.mongodb.uri);

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

module.exports = app; 
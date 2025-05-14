/**
 * LagoTrade Database Schema
 * 
 * This file defines the database schemas for both MongoDB and PostgreSQL.
 */

// MongoDB Schemas
const mongoSchemas = {
    User: {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String },
        avatar: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        preferences: {
            theme: { type: String, default: 'light' },
            defaultView: { type: String, default: 'dashboard' },
            notifications: {
                email: { type: Boolean, default: true },
                push: { type: Boolean, default: true },
                sms: { type: Boolean, default: false }
            }
        },
        isVerified: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        lastLogin: { type: Date }
    },

    Watchlist: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        name: { type: String, required: true },
        securities: [{
            symbol: { type: String, required: true },
            exchange: { type: String, required: true },
            addedAt: { type: Date, default: Date.now }
        }],
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    },

    Notification: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, enum: ['alert', 'info', 'success', 'error'] },
        isRead: { type: Boolean, default: false },
        metadata: { type: Object },
        createdAt: { type: Date, default: Date.now }
    },

    AIPrediction: {
        symbol: { type: String, required: true },
        exchange: { type: String, required: true },
        date: { type: Date, required: true },
        predictions: {
            '1d': {
                price: { type: Number },
                confidence: { type: Number }
            },
            '7d': {
                price: { type: Number },
                confidence: { type: Number }
            },
            '30d': {
                price: { type: Number },
                confidence: { type: Number }
            }
        },
        signals: {
            trend: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
            strength: { type: Number },
            support: [{ type: Number }],
            resistance: [{ type: Number }]
        },
        sentiment: {
            value: { type: Number },
            sources: [{ type: String }]
        },
        createdAt: { type: Date, default: Date.now }
    },

    TradingStrategy: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        name: { type: String, required: true },
        description: { type: String },
        symbols: [{ type: String }],
        exchange: { type: String, required: true },
        parameters: { type: Object },
        risk: {
            maxLoss: { type: Number },
            trailingStopLoss: { type: Number }
        },
        schedule: {
            runAt: { type: String },
            timezone: { type: String },
            frequency: { type: String, enum: ['daily', 'weekly'] }
        },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'PAUSED'], default: 'INACTIVE' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        activatedAt: { type: Date }
    },

    BrokerIntegration: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        broker: { type: String, enum: ['upstox', 'zerodha', 'angelone'], required: true },
        accessToken: { type: String },
        refreshToken: { type: String },
        tokenExpiry: { type: Date },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        lastSynced: { type: Date }
    },

    CommunityPost: {
        userId: { type: 'ObjectId', ref: 'User', required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        tags: [{ type: String }],
        likes: [{ type: 'ObjectId', ref: 'User' }],
        comments: [{
            userId: { type: 'ObjectId', ref: 'User' },
            content: { type: String },
            createdAt: { type: Date, default: Date.now }
        }],
        attachments: [{
            type: { type: String, enum: ['image', 'chart', 'document'] },
            url: { type: String }
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
};

// PostgreSQL Schemas
const postgresTables = [
    // Users Table (Simplified, main user data in MongoDB)
    `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    mongo_id VARCHAR(24) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

    // Orders Table
    `CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reference_id VARCHAR(50) UNIQUE,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2),
    trigger_price DECIMAL(10, 2),
    status VARCHAR(20) NOT NULL,
    product VARCHAR(10) NOT NULL,
    validity VARCHAR(10),
    disclosed_quantity INTEGER,
    placed_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    executed_at TIMESTAMP,
    broker_order_id VARCHAR(50),
    broker VARCHAR(20),
    is_amo BOOLEAN DEFAULT FALSE
  )`,

    // Portfolio Holdings Table
    `CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    isin VARCHAR(20),
    quantity INTEGER NOT NULL,
    average_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2),
    investment_value DECIMAL(12, 2),
    current_value DECIMAL(12, 2),
    pnl DECIMAL(10, 2),
    pnl_percent DECIMAL(5, 2),
    last_updated_at TIMESTAMP
  )`,

    // Transactions Table
    `CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    reference_id VARCHAR(50) UNIQUE,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    charges DECIMAL(10, 2) NOT NULL,
    transaction_at TIMESTAMP NOT NULL,
    broker VARCHAR(20)
  )`,

    // Funds Table
    `CREATE TABLE funds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reference_id VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    description TEXT,
    transaction_at TIMESTAMP NOT NULL,
    bank_account_id INTEGER
  )`,

    // Bank Accounts Table
    `CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

    // Market Data Table
    `CREATE TABLE market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    open DECIMAL(10, 2) NOT NULL,
    high DECIMAL(10, 2) NOT NULL,
    low DECIMAL(10, 2) NOT NULL,
    close DECIMAL(10, 2) NOT NULL,
    volume BIGINT NOT NULL,
    UNIQUE(symbol, exchange, date)
  )`,

    // Trading Strategy Executions
    `CREATE TABLE strategy_executions (
    id SERIAL PRIMARY KEY,
    strategy_id VARCHAR(24) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    execution_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL,
    orders_generated INTEGER,
    orders_executed INTEGER,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

    // Strategy Performance Table
    `CREATE TABLE strategy_performance (
    id SERIAL PRIMARY KEY,
    strategy_id VARCHAR(24) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    trades_total INTEGER NOT NULL,
    trades_winning INTEGER NOT NULL,
    trades_losing INTEGER NOT NULL,
    win_rate DECIMAL(5, 2) NOT NULL,
    profit_factor DECIMAL(5, 2),
    total_return DECIMAL(10, 2) NOT NULL,
    annualized_return DECIMAL(5, 2),
    max_drawdown DECIMAL(5, 2),
    sharpe_ratio DECIMAL(5, 2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`
];

// Redis Key Patterns
const redisKeyPatterns = {
    // Sessions
    'session:{sessionId}': 'User session data',

    // Market Data Cache
    'market:quote:{symbol}:{exchange}': 'Latest quote for a symbol',
    'market:candles:{symbol}:{exchange}:{timeframe}': 'Candle data for specific timeframe',
    'market:top:{exchange}:{type}': 'Top movers (gainers/losers)',

    // Order Book
    'orderbook:{symbol}:{exchange}': 'Current order book for a symbol',

    // User Data Cache
    'user:{userId}:holdings': 'User portfolio holdings cache',
    'user:{userId}:watchlists': 'User watchlists cache',

    // Rate Limiting
    'ratelimit:{ip}': 'API rate limiting counter',
    'ratelimit:{userId}:{endpoint}': 'User-specific endpoint rate limiting'
};

module.exports = {
    mongoSchemas,
    postgresTables,
    redisKeyPatterns
}; 
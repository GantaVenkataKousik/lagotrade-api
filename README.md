# LagoTrade - AI-Driven Trading Platform

LagoTrade is a comprehensive trading platform with AI-powered trading insights, portfolio management, and automated trading capabilities.

## Architecture Overview

### Database Architecture
NSE NIFTY 50:

API :


https://www.nseindia.com/api/market-data-pre-open?key=NIFTY


RESPONSE:

{
    "declines": 22,
    "unchanged": 13,
    "data": [
        {
            "metadata": {
                "symbol": "INFY",
                "identifier": "INFYEQN",
                "purpose": null,
                "lastPrice": 1571,
                "change": 7.4,
                "pChange": 0.47,
                "previousClose": 1585.6,
                "finalQuantity": 60095,
                "totalTurnover": 94409245,
                "marketCap": 5697750293419.47,
                "yearHigh": 2006.45,
                "yearLow": 1307,
                "iep": 1571,
                "chartTodayPath": "https://nsearchives.nseindia.com/today/preOpen_INFYEQN.svg"
            },
            "detail": {
                "preOpenMarket": {
                    "preopen": [
                        {
                            "price": 1570.1,
                            "buyQty": 755,
                            "sellQty": 0
                        },
                        {
                            "price": 1570.5,
                            "buyQty": 5,
                            "sellQty": 0
                        },
                        {
                            "price": 1570.6,
                            "buyQty": 100,
                            "sellQty": 0
                        },
                        {
                            "price": 1570.8,
                            "buyQty": 20,
                            "sellQty": 0
                        },
                        {
                            "price": 1571,
                            "buyQty": 61,
                            "sellQty": 0,
                            "iep": true
                        },
                        {
                            "price": 1571.5,
                            "buyQty": 0,
                            "sellQty": 400
                        },
                        {
                            "price": 1572,
                            "buyQty": 0,
                            "sellQty": 100
                        },
                        {
                            "price": 1572.3,
                            "buyQty": 0,
                            "sellQty": 2
                        },
                        {
                            "price": 1572.8,
                            "buyQty": 0,
                            "sellQty": 500
                        },
                        {
                            "price": 1573.2,
                            "buyQty": 0,
                            "sellQty": 3
                        }
                    ],
                    "ato": {
                        "totalBuyQuantity": 0,
                        "totalSellQuantity": 0
                    },
                    "IEP": 1571,
                    "totalTradedVolume": 60095,
                    "finalPrice": 1571,
                    "finalQuantity": 60095,
                    "lastUpdateTime": "30-May-2025 09:07:47",
                    "totalSellQuantity": 154169,
                    "totalBuyQuantity": 43286,
                    "atoBuyQty": 0,
                    "atoSellQty": 0,
                    "Change": 7.4,
                    "perChange": 0.47,
                    "prevClose": 1585.6
                }
            }
        },
        {
            "metadata": {
                "symbol": "APOLLOHOSP",
                "identifier": "APOLLOHOSPEQN",
                "purpose": null,
                "lastPrice": 6950,
                "change": 27,
                "pChange": 0.39,
                "previousClose": 6923,
                "finalQuantity": 549,
                "totalTurnover": 3815550,
                "marketCap": 698726545835.41,
                "yearHigh": 7545.35,
                "yearLow": 5693.2,
                "iep": 6950,
                "chartTodayPath": "https://nsearchives.nseindia.com/today/preOpen_APOLLOHOSPEQN.svg"
            },
            "detail": {
                "preOpenMarket": {
                    "preopen": [
                        {
                            "price": 6925.5,
                            "buyQty": 15,
                            "sellQty": 0
                        },
                        {
                            "price": 6930,
                            "buyQty": 49,
                            "sellQty": 0
                        },
                        {
                            "price": 6935,
                            "buyQty": 227,
                            "sellQty": 0
                        },
                        {
                            "price": 6936,
                            "buyQty": 16,
                            "sellQty": 0
                        },
                        {
                            "price": 6947,
                            "buyQty": 5,
                            "sellQty": 0
                        },
                        {
                            "price": 6950,
                            "buyQty": 0,
                            "sellQty": 17,
                            "iep": true
                        },
                        {
                            "price": 6956.5,
                            "buyQty": 0,
                            "sellQty": 1
                        },
                        {
                            "price": 6957.5,
                            "buyQty": 0,
                            "sellQty": 323
                        },
                        {
                            "price": 6972,
                            "buyQty": 0,
                            "sellQty": 10
                        },
                        {
                            "price": 6975,
                            "buyQty": 0,
                            "sellQty": 10
                        }
                    ],
                    "ato": {
                        "totalBuyQuantity": 0,
                        "totalSellQuantity": 0
                    },
                    "IEP": 6950,
                    "totalTradedVolume": 549,
                    "finalPrice": 6950,
                    "finalQuantity": 549,
                    "lastUpdateTime": "30-May-2025 09:07:51",
                    "totalSellQuantity": 6027,
                    "totalBuyQuantity": 3066,
                    "atoBuyQty": 0,
                    "atoSellQty": 0,
                    "Change": 27,
                    "perChange": 0.39,
                    "prevClose": 6923
                }
            }
        },
We've adopted a multi-database approach similar to Upstox:

1. **MongoDB**
   - Purpose: Flexible schema data, user profiles, preferences
   - Collections: Users, Watchlists, Notifications, AI Predictions
   - Use case: Data that requires flexible schema and frequent changes

2. **PostgreSQL**
   - Purpose: Critical financial and transactional data
   - Tables: Orders, Transactions, Portfolio, Fund Transfers
   - Use case: Data requiring ACID compliance and transactional integrity

3. **Redis**
   - Purpose: Caching, session management, real-time data
   - Use case: Market data caching, order books, session tokens

4. **Elasticsearch**
   - Purpose: Search functionality, log analytics
   - Use case: Trading history search, market analysis, system monitoring

### AI Model Integration

The platform includes AI-driven prediction models for stock market trends and automated trading. These models will be:
- Initially served with dummy prediction data
- Eventually trained on historical market data
- Continuously improved based on prediction accuracy

## Database Setup

### PostgreSQL Setup

LagoTrade uses PostgreSQL for transaction data and other critical trading information. We've created tools to make setting up PostgreSQL simple:

#### Windows Users
Run our setup script:
```bash
cd backend
pwsh .\setup-postgres.ps1
```
This interactive script will:
1. Verify PostgreSQL is installed
2. Create the database and user
3. Update your `.env` file
4. Initialize database tables

#### Manual Setup
1. Install PostgreSQL from the [official website](https://www.postgresql.org/download/)
2. Create a database and user:
   ```sql
   CREATE DATABASE lagotrade;
   CREATE USER lagouser WITH ENCRYPTED PASSWORD 'yourpassword';
   GRANT ALL PRIVILEGES ON DATABASE lagotrade TO lagouser;
   ```
3. Configure your `.env` file with the connection string:
   ```
   POSTGRES_URI=postgresql://lagouser:yourpassword@localhost:5432/lagotrade
   ```
4. Initialize the database:
   ```bash
   cd backend
   npm run init-db
   ```

For detailed instructions, see [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)

## API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/verify-email/:token
```

### User Management

```
GET /api/users/me
PUT /api/users/me
PUT /api/users/password
GET /api/users/preferences
PUT /api/users/preferences
POST /api/users/avatar
```

### Market Data

```
GET /api/markets/quotes
GET /api/markets/quotes/:symbol
GET /api/markets/historical/:symbol
GET /api/markets/intraday/:symbol
GET /api/markets/movers
GET /api/markets/indices
GET /api/markets/futures
GET /api/markets/options
```

### Watchlists

```
GET /api/watchlists
POST /api/watchlists
GET /api/watchlists/:id
PUT /api/watchlists/:id
DELETE /api/watchlists/:id
POST /api/watchlists/:id/securities
DELETE /api/watchlists/:id/securities/:symbol
```

### Portfolio Management

```
GET /api/portfolio
GET /api/portfolio/holdings
GET /api/portfolio/positions
GET /api/portfolio/summary
GET /api/portfolio/performance
GET /api/portfolio/allocation
GET /api/portfolio/dividends
```

### Order Management

```
GET /api/orders
POST /api/orders
GET /api/orders/:id
PUT /api/orders/:id
DELETE /api/orders/:id
GET /api/orders/history
```

### Trading

```
POST /api/trading/market-order
POST /api/trading/limit-order
POST /api/trading/stop-order
POST /api/trading/bracket-order
POST /api/trading/cover-order
POST /api/trading/modify-order
POST /api/trading/cancel-order
```

### Transactions

```
GET /api/transactions
GET /api/transactions/:id
GET /api/transactions/history
GET /api/transactions/report
```

### Funds

```
GET /api/funds/balance
POST /api/funds/deposit
POST /api/funds/withdraw
GET /api/funds/history
GET /api/funds/bank-accounts
POST /api/funds/bank-accounts
```

### AI Predictions

```
GET /api/ai-predictor/trends/:symbol
GET /api/ai-predictor/portfolio-insights
GET /api/ai-predictor/recommendations
GET /api/ai-predictor/risk-assessment
GET /api/ai-predictor/sentiment/:symbol
POST /api/ai-predictor/custom-analysis
```

### Auto Trading

```
GET /api/auto-trading/strategies
POST /api/auto-trading/strategies
GET /api/auto-trading/strategies/:id
PUT /api/auto-trading/strategies/:id
DELETE /api/auto-trading/strategies/:id
POST /api/auto-trading/strategies/:id/activate
POST /api/auto-trading/strategies/:id/deactivate
GET /api/auto-trading/performance
```

### Broker Integration (Upstox)

```
POST /api/brokers/upstox/authorize
GET /api/brokers/upstox/callback
GET /api/brokers/upstox/holdings
GET /api/brokers/upstox/positions
GET /api/brokers/upstox/orders
POST /api/brokers/upstox/place-order
PUT /api/brokers/upstox/modify-order
DELETE /api/brokers/upstox/cancel-order
```

### Analytics

```
GET /api/analytics/trading-history
GET /api/analytics/profit-loss
GET /api/analytics/performance
GET /api/analytics/patterns
GET /api/analytics/risk-metrics
GET /api/analytics/reports
```

### Community & Social

```
GET /api/community/posts
POST /api/community/posts
GET /api/community/posts/:id
PUT /api/community/posts/:id
DELETE /api/community/posts/:id
POST /api/community/posts/:id/comments
GET /api/community/users/:id
POST /api/community/follow/:userId
DELETE /api/community/follow/:userId
```

### Learn & Education

```
GET /api/learn/articles
GET /api/learn/articles/:id
GET /api/learn/courses
GET /api/learn/courses/:id
GET /api/learn/videos
GET /api/learn/videos/:id
GET /api/learn/glossary
```

### Notifications

```
GET /api/notifications
PUT /api/notifications/:id/read
PUT /api/notifications/read-all
GET /api/notifications/preferences
PUT /api/notifications/preferences
```

### Risk Management

```
GET /api/risk-management/profile
PUT /api/risk-management/profile
GET /api/risk-management/limits
PUT /api/risk-management/limits
GET /api/risk-management/alerts
POST /api/risk-management/alerts
DELETE /api/risk-management/alerts/:id
```

### Developer API

```
GET /api/developer/api-keys
POST /api/developer/api-keys
DELETE /api/developer/api-keys/:id
GET /api/developer/webhooks
POST /api/developer/webhooks
PUT /api/developer/webhooks/:id
DELETE /api/developer/webhooks/:id
```

## Data Models

### MongoDB Collections

#### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "string",
  "password": "string (hashed)",
  "name": "string",
  "phone": "string",
  "avatar": "string (URL)",
  "role": "enum ['user', 'admin']",
  "preferences": {
    "theme": "string",
    "defaultView": "string",
    "notifications": {}
  },
  "isVerified": "boolean",
  "createdAt": "date",
  "updatedAt": "date",
  "lastLogin": "date"
}
```

#### Watchlists Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "securities": [
    {
      "symbol": "string",
      "exchange": "string",
      "addedAt": "date"
    }
  ],
  "isDefault": "boolean",
  "createdAt": "date",
  "updatedAt": "date"
}
```

#### AI Predictions Collection
```json
{
  "_id": "ObjectId",
  "symbol": "string",
  "date": "date",
  "predictions": {
    "1d": {"price": "number", "confidence": "number"},
    "7d": {"price": "number", "confidence": "number"},
    "30d": {"price": "number", "confidence": "number"}
  },
  "signals": {
    "trend": "enum ['bullish', 'bearish', 'neutral']",
    "strength": "number",
    "support": "number",
    "resistance": "number"
  },
  "sentiment": {
    "value": "number",
    "sources": ["string"]
  },
  "createdAt": "date"
}
```

### PostgreSQL Tables

#### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  exchange VARCHAR(10) NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  transaction_type VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2),
  trigger_price DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL,
  placed_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  broker_order_id VARCHAR(50),
  is_amo BOOLEAN DEFAULT FALSE
);
```

#### Portfolio Holdings Table
```sql
CREATE TABLE portfolio_holdings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  exchange VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  average_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2),
  pnl DECIMAL(10, 2),
  pnl_percent DECIMAL(5, 2),
  investment_value DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  updated_at TIMESTAMP
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  symbol VARCHAR(20) NOT NULL,
  exchange VARCHAR(10) NOT NULL,
  transaction_type VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  charges DECIMAL(10, 2) NOT NULL,
  transaction_at TIMESTAMP NOT NULL
);
```

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- MongoDB (>= 4.4)
- PostgreSQL (>= 13)
- Redis (>= 6.0)
- Elasticsearch (>= 7.10)

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/lagotrade.git
cd lagotrade
```

2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables

Create `.env` files in both frontend and backend directories using the provided example files.

4. Start the development servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev
```

## Environment Variables

### Backend `.env`

```
# Database
MONGO_URI=mongodb://localhost:27017/lagotrade
POSTGRES_URI=postgres://user:password@localhost:5432/lagotrade
REDIS_URI=redis://localhost:6379

# Auth
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Upstox Integration
UPSTOX_API_KEY=your_upstox_api_key
UPSTOX_API_SECRET=your_upstox_api_secret
UPSTOX_REDIRECT_URI=http://localhost:5000/api/brokers/upstox/callback

# Other services
ELASTICSEARCH_URI=http://localhost:9200
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:5000
```

## Contributing

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests to us.

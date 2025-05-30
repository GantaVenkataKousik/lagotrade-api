# AI Training Data System for NSE NIFTY 50

## Overview

The LagoTrade backend now includes a comprehensive market data storage system designed specifically for AI model training. This system continuously collects, processes, and stores NSE NIFTY 50 stock data with rich metadata for machine learning applications.

## Features

### 📊 Data Collection
- **Real-time NSE NIFTY 50 data** fetched every 5 minutes during market hours
- **Market session tracking** (pre-market, market-hours, post-market, after-hours)
- **Comprehensive stock metrics** including price, volume, technical indicators
- **API response monitoring** with success rates and response times
- **Error tracking** for data quality assurance

### 🎯 Production Environment Control
- **Environment-based execution**: Only sends emails in production (`NODE_ENV=production`)
- **Data collection continues** in all environments for training purposes
- **Configurable thresholds**: Currently set to 0.5% gain/loss for alerts

### 💾 Data Storage Schema

#### Market Data Collection
```javascript
{
  timestamp: Date,
  marketSession: 'pre-market' | 'market-hours' | 'post-market' | 'after-hours',
  niftyIndex: {
    value: Number,
    change: Number,
    pChange: Number
  },
  totalStocks: Number,
  gainers: Number,
  losers: Number,
  unchanged: Number,
  stocks: [StockData],
  marketSentiment: 'bullish' | 'bearish' | 'neutral',
  totalVolume: Number,
  avgVolume: Number,
  alertSent: Boolean,
  alertReason: 'significant-movement' | 'scheduled' | 'manual' | 'error',
  dataSource: 'NSE',
  apiResponse: {
    success: Boolean,
    responseTime: Number,
    errorMessage: String
  }
}
```

#### Individual Stock Data
```javascript
{
  symbol: String,
  companyName: String,
  lastPrice: Number,
  change: Number,
  pChange: Number,
  previousClose: Number,
  open: Number,
  dayHigh: Number,
  dayLow: Number,
  totalTradedVolume: Number,
  totalTradedValue: Number,
  yearHigh: Number,
  yearLow: Number,
  // Technical indicators (for future enhancement)
  rsi: Number,
  sma20: Number,
  sma50: Number,
  ema12: Number,
  ema26: Number,
  volatility: Number,
  beta: Number
}
```

## API Endpoints for AI Training

### 1. Get Training Data
```
GET /api/ai-training/training-data
```

**Query Parameters:**
- `days` (default: 30) - Number of days to fetch
- `symbols` - Comma-separated stock symbols (e.g., "RELIANCE,TCS,INFY")
- `minPriceChange` - Minimum percentage change filter
- `marketSession` - Filter by market session
- `format` - Response format ('json' or 'csv')

**Example:**
```
GET /api/ai-training/training-data?days=7&symbols=RELIANCE,TCS&format=csv
```

### 2. Stock Time Series
```
GET /api/ai-training/stock-timeseries/:symbol
```

**Parameters:**
- `symbol` - Stock symbol (e.g., "RELIANCE")
- `days` - Number of days (default: 30)

**Example:**
```
GET /api/ai-training/stock-timeseries/RELIANCE?days=60
```

### 3. Market Volatility Analysis
```
GET /api/ai-training/market-volatility
```

**Query Parameters:**
- `days` - Analysis period (default: 30)

### 4. Market Statistics
```
GET /api/ai-training/market-stats
```

**Query Parameters:**
- `days` - Analysis period (default: 7)

### 5. Export Data
```
GET /api/ai-training/export/:format
```

**Supported Formats:**
- `json` - Standard JSON format
- `csv` - Comma-separated values for ML libraries
- `jsonl` - JSON Lines format for streaming

**Example:**
```
GET /api/ai-training/export/csv?days=30&symbols=RELIANCE,TCS,INFY
```

## AI Model Training Use Cases

### 1. Price Prediction Models
- **Features**: lastPrice, volume, technical indicators, market sentiment
- **Target**: Future price movements
- **Data**: Time series data with multiple timeframes

### 2. Market Sentiment Analysis
- **Features**: gainers/losers ratio, volume patterns, index movements
- **Target**: Market sentiment classification
- **Data**: Aggregated market data with sentiment labels

### 3. Volatility Prediction
- **Features**: Historical volatility, volume, price ranges
- **Target**: Future volatility levels
- **Data**: Statistical measures and rolling calculations

### 4. Anomaly Detection
- **Features**: Price movements, volume spikes, API response patterns
- **Target**: Unusual market behavior
- **Data**: Real-time data with error tracking

## Data Quality Features

### 📈 Automatic Calculations
- **Market sentiment** based on gainers/losers ratio
- **Volume statistics** (total, average)
- **Performance metrics** (response times, success rates)

### 🔍 Data Validation
- **API response monitoring** with success/failure tracking
- **Error message storage** for debugging
- **Timestamp validation** for data integrity

### 📊 Indexing Strategy
- **Timestamp indexing** for time-based queries
- **Symbol indexing** for stock-specific analysis
- **Percentage change indexing** for movement filtering
- **Market session indexing** for session-based analysis

## Environment Configuration

### Production Mode (`NODE_ENV=production`)
```bash
✅ Email alerts sent to target addresses
✅ Market data stored for AI training
✅ Error notifications sent
✅ Full logging enabled
```

### Development Mode (default)
```bash
⚠️  Email alerts disabled
✅ Market data still stored for AI training
⚠️  Error notifications disabled
✅ Console logging enabled
```

## Setup Instructions

### 1. Environment Setup
```bash
# Run the setup script
node setup-production.js

# Check configuration
node check-environment.js
```

### 2. Required Environment Variables
```env
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
MONGO_URI=your_mongodb_connection_string
```

### 3. Start the System
```bash
npm start
```

## Data Access Examples

### Python Example (using requests)
```python
import requests
import pandas as pd

# Get training data as CSV
response = requests.get('http://localhost:5000/api/ai-training/training-data?format=csv&days=30')
df = pd.read_csv(StringIO(response.text))

# Get specific stock time series
response = requests.get('http://localhost:5000/api/ai-training/stock-timeseries/RELIANCE?days=60')
stock_data = response.json()
```

### JavaScript Example
```javascript
// Get market statistics
const response = await fetch('/api/ai-training/market-stats?days=7');
const stats = await response.json();

// Export data for ML
const csvData = await fetch('/api/ai-training/export/csv?days=30');
const csvText = await csvData.text();
```

## Monitoring and Maintenance

### 📊 Data Collection Status
- Monitor API success rates via `/api/ai-training/market-stats`
- Check data completeness with timestamp analysis
- Review error patterns in stored error messages

### 🔧 Performance Optimization
- Database indexes automatically created for efficient querying
- Configurable data retention policies
- Batch processing for large data exports

### 📈 Scaling Considerations
- MongoDB sharding for large datasets
- API rate limiting for data exports
- Caching strategies for frequently accessed data

## Future Enhancements

### 🎯 Planned Features
- **Technical indicator calculations** (RSI, MACD, Bollinger Bands)
- **Real-time streaming API** for live data feeds
- **Data preprocessing pipelines** for ML-ready datasets
- **Automated model training triggers** based on data volume
- **Data quality scoring** and validation metrics

### 🔮 Advanced Analytics
- **Pattern recognition** in price movements
- **Correlation analysis** between stocks
- **Market regime detection** (bull/bear markets)
- **Event impact analysis** on stock prices

---

## Support

For questions or issues with the AI training data system:
1. Check the environment configuration with `node check-environment.js`
2. Review the API endpoints documentation above
3. Monitor the console logs for data collection status
4. Verify database connectivity and storage

The system is designed to be robust and continue data collection even during API failures, ensuring comprehensive datasets for AI model training. 
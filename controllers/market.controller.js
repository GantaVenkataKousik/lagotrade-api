/**
 * Market Controller for LagoTrade API
 */

const { getCache, setCache } = require('../utils/db.utils');
const { fetchUpstoxMarketData, searchInstruments } = require('../services/broker.service');
const axios = require('axios');

// Get market quotes for symbols
exports.getMarketQuotes = async (req, res, next) => {
    try {
        const { symbols, exchange } = req.query;

        if (!symbols) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbols parameter'
            });
        }

        const symbolsArray = symbols.split(',').map(s => s.trim().toUpperCase());

        // Cache key based on symbols and exchange
        const cacheKey = `market_quotes:${exchange || 'NSE'}:${symbolsArray.sort().join(',')}`;

        // Try to get from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData
            });
        }

        // Fetch from broker API
        const quotes = await fetchUpstoxMarketData(symbolsArray, exchange || 'NSE');

        // Cache the data for 1 minute
        await setCache(cacheKey, quotes, 60);

        res.status(200).json({
            success: true,
            data: quotes
        });
    } catch (error) {
        next(error);
    }
};

// Get market indices
exports.getMarketIndices = async (req, res, next) => {
    try {
        const { indices } = req.query;

        const indicesArray = indices ? indices.split(',').map(i => i.trim().toUpperCase()) : ['NIFTY 50', 'NIFTY BANK', 'SENSEX'];

        // Cache key
        const cacheKey = `market_indices:${indicesArray.sort().join(',')}`;

        // Try to get from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData
            });
        }

        // Fetch from broker API
        const indicesData = await fetchUpstoxMarketData(indicesArray, 'NSE', true);

        // Cache the data for 1 minute
        await setCache(cacheKey, indicesData, 60);

        res.status(200).json({
            success: true,
            data: indicesData
        });
    } catch (error) {
        next(error);
    }
};

// Search instruments
exports.searchInstruments = async (req, res, next) => {
    try {
        const { query, exchange } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide search query'
            });
        }

        // Cache key
        const cacheKey = `instrument_search:${query}:${exchange || 'all'}`;

        // Try to get from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData
            });
        }

        // Search instruments
        const instruments = await searchInstruments(query, exchange);

        // Cache the data for 1 hour
        await setCache(cacheKey, instruments, 3600);

        res.status(200).json({
            success: true,
            data: instruments
        });
    } catch (error) {
        next(error);
    }
};

// Get historical data
exports.getHistoricalData = async (req, res, next) => {
    try {
        const { symbol, exchange, interval, from, to } = req.query;

        if (!symbol || !interval) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbol and interval parameters'
            });
        }

        // Cache key
        const cacheKey = `historical_data:${symbol}:${exchange || 'NSE'}:${interval}:${from || ''}:${to || ''}`;

        // Try to get from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData
            });
        }

        // TODO: Implement actual historical data fetching
        // For now, generating dummy data
        const dummyData = generateDummyHistoricalData(symbol, interval, from, to);

        // Cache the data
        const cacheTTL = interval === '1D' ? 86400 : 3600; // 1 day for daily, 1 hour for others
        await setCache(cacheKey, dummyData, cacheTTL);

        res.status(200).json({
            success: true,
            data: dummyData
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to generate dummy historical data
const generateDummyHistoricalData = (symbol, interval, from, to) => {
    const data = [];
    const now = new Date();
    let startDate = from ? new Date(from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : now;

    // Base price and volatility based on symbol
    const basePrice = 1000 + (symbol.charCodeAt(0) % 26) * 100;
    const volatility = 0.02;

    let currentPrice = basePrice;

    // Determine interval in milliseconds
    let intervalMs;
    switch (interval) {
        case '1m':
            intervalMs = 60 * 1000;
            break;
        case '5m':
            intervalMs = 5 * 60 * 1000;
            break;
        case '15m':
            intervalMs = 15 * 60 * 1000;
            break;
        case '30m':
            intervalMs = 30 * 60 * 1000;
            break;
        case '1h':
            intervalMs = 60 * 60 * 1000;
            break;
        case '1D':
        default:
            intervalMs = 24 * 60 * 60 * 1000;
            break;
    }

    // Generate data points
    while (startDate <= endDate) {
        // Random price movement
        const change = currentPrice * volatility * (Math.random() - 0.5);
        currentPrice += change;

        // Ensure price is positive
        if (currentPrice <= 0) {
            currentPrice = basePrice;
        }

        // Calculate OHLC
        const open = currentPrice;
        const high = open * (1 + Math.random() * volatility);
        const low = open * (1 - Math.random() * volatility);
        const close = (open + high + low) / 3 + (Math.random() - 0.5) * volatility * open;

        // Add data point
        data.push({
            timestamp: startDate.toISOString(),
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: Math.floor(Math.random() * 100000) + 10000
        });

        // Move to next interval
        startDate = new Date(startDate.getTime() + intervalMs);
    }

    return data;
};

exports.getPreOpenMarketData = async (req, res) => {
    try {
        const { data } = await axios.get('https://www.nseindia.com/api/market-data-pre-open?key=NIFTY', {
            headers: {
                'User-Agent': 'Mozilla/5.0', // NSE blocks non-browser user agents
                'Accept': 'application/json'
            }
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch NSE data' });
    }
}; 
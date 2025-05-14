/**
 * AI Predictor Controller for LagoTrade API
 */

const { getCache, setCache } = require('../utils/db.utils');
const AIPrediction = require('../models/ai-prediction.model');

// Get prediction for a symbol
exports.getPrediction = async (req, res, next) => {
    try {
        const { symbol, exchange = 'NSE' } = req.query;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbol parameter'
            });
        }

        // Cache key
        const cacheKey = `ai_prediction:${symbol}:${exchange}`;

        // Try to get from cache first
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                data: cachedData
            });
        }

        // Get from database
        const prediction = await AIPrediction.findOne({
            symbol: symbol.toUpperCase(),
            exchange: exchange.toUpperCase(),
            date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }).sort({ date: -1 });

        if (prediction) {
            // Cache the data
            await setCache(cacheKey, prediction, 3600); // 1 hour

            return res.status(200).json({
                success: true,
                data: prediction
            });
        }

        // If not found, generate dummy prediction
        // TODO: Replace with actual AI model call
        const dummyPrediction = generateDummyPrediction(symbol, exchange);

        // Save to database
        const newPrediction = new AIPrediction(dummyPrediction);
        await newPrediction.save();

        // Cache the data
        await setCache(cacheKey, newPrediction, 3600); // 1 hour

        res.status(200).json({
            success: true,
            data: newPrediction
        });
    } catch (error) {
        next(error);
    }
};

// Get predictions for multiple symbols
exports.getBatchPredictions = async (req, res, next) => {
    try {
        const { symbols, exchange = 'NSE' } = req.body;

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of symbols'
            });
        }

        const predictions = [];

        // Process each symbol
        for (const symbol of symbols) {
            // Cache key
            const cacheKey = `ai_prediction:${symbol}:${exchange}`;

            // Try to get from cache first
            const cachedData = await getCache(cacheKey);
            if (cachedData) {
                predictions.push(cachedData);
                continue;
            }

            // Get from database
            const prediction = await AIPrediction.findOne({
                symbol: symbol.toUpperCase(),
                exchange: exchange.toUpperCase(),
                date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }).sort({ date: -1 });

            if (prediction) {
                // Cache the data
                await setCache(cacheKey, prediction, 3600); // 1 hour

                predictions.push(prediction);
                continue;
            }

            // If not found, generate dummy prediction
            // TODO: Replace with actual AI model call
            const dummyPrediction = generateDummyPrediction(symbol, exchange);

            // Save to database
            const newPrediction = new AIPrediction(dummyPrediction);
            await newPrediction.save();

            // Cache the data
            await setCache(cacheKey, newPrediction, 3600); // 1 hour

            predictions.push(newPrediction);
        }

        res.status(200).json({
            success: true,
            data: predictions
        });
    } catch (error) {
        next(error);
    }
};

// Get prediction history for a symbol
exports.getPredictionHistory = async (req, res, next) => {
    try {
        const { symbol, exchange = 'NSE', days = 30 } = req.query;

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Please provide symbol parameter'
            });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get from database
        const predictions = await AIPrediction.find({
            symbol: symbol.toUpperCase(),
            exchange: exchange.toUpperCase(),
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            data: predictions
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to generate dummy prediction
const generateDummyPrediction = (symbol, exchange) => {
    const now = new Date();
    const basePrice = 1000 + (symbol.charCodeAt(0) % 26) * 100;

    // Generate random price changes with some bias
    const bias = Math.random() > 0.5 ? 1 : -1;
    const oneDayChange = basePrice * 0.02 * (Math.random() + 0.5) * bias;
    const sevenDayChange = oneDayChange * (2 + Math.random());
    const thirtyDayChange = sevenDayChange * (1.5 + Math.random());

    // Determine trend based on price changes
    const trend = thirtyDayChange > 0 ? 'bullish' : (thirtyDayChange < 0 ? 'bearish' : 'neutral');

    // Generate support and resistance levels
    const supportLevel1 = basePrice - basePrice * (0.02 + Math.random() * 0.02);
    const supportLevel2 = supportLevel1 - basePrice * (0.02 + Math.random() * 0.02);
    const resistanceLevel1 = basePrice + basePrice * (0.02 + Math.random() * 0.02);
    const resistanceLevel2 = resistanceLevel1 + basePrice * (0.02 + Math.random() * 0.02);

    return {
        symbol: symbol.toUpperCase(),
        exchange: exchange.toUpperCase(),
        date: now,
        predictions: {
            '1d': {
                price: basePrice + oneDayChange,
                confidence: 0.7 + Math.random() * 0.2
            },
            '7d': {
                price: basePrice + sevenDayChange,
                confidence: 0.6 + Math.random() * 0.2
            },
            '30d': {
                price: basePrice + thirtyDayChange,
                confidence: 0.5 + Math.random() * 0.2
            }
        },
        signals: {
            trend,
            strength: 0.6 + Math.random() * 0.3,
            support: [supportLevel1, supportLevel2],
            resistance: [resistanceLevel1, resistanceLevel2]
        },
        sentiment: {
            value: 0.4 + Math.random() * 0.6 * (trend === 'bullish' ? 1 : (trend === 'bearish' ? -1 : 0.2)),
            sources: ['social_media', 'news', 'analyst_ratings']
        },
        createdAt: now
    };
}; 
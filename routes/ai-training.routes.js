const express = require('express');
const router = express.Router();
const MarketData = require('../models/market-data.model');

// Get training data for AI models
router.get('/training-data', async (req, res) => {
    try {
        const {
            days = 30,
            symbols,
            minPriceChange,
            marketSession,
            format = 'json'
        } = req.query;

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const endDate = new Date();

        const options = {
            startDate,
            endDate,
            symbols: symbols ? symbols.split(',') : null,
            minPriceChange: minPriceChange ? parseFloat(minPriceChange) : null,
            marketSession
        };

        const trainingData = await MarketData.getTrainingData(options);

        if (format === 'csv') {
            // Convert to CSV format for ML libraries
            const csvHeaders = 'timestamp,symbol,lastPrice,change,pChange,volume,high,low,open,previousClose,marketSession,niftyChange,marketSentiment,totalVolume\n';
            const csvData = trainingData.map(row =>
                `${row.timestamp.toISOString()},${row.symbol},${row.lastPrice},${row.change},${row.pChange},${row.volume},${row.high},${row.low},${row.open},${row.previousClose},${row.marketSession},${row.niftyIndex.pChange},${row.marketSentiment},${row.totalVolume}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=market-training-data.csv');
            return res.send(csvHeaders + csvData);
        }

        res.json({
            success: true,
            data: trainingData,
            metadata: {
                totalRecords: trainingData.length,
                dateRange: { startDate, endDate },
                filters: options
            }
        });
    } catch (error) {
        console.error('Error fetching training data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get stock time series data
router.get('/stock-timeseries/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { days = 30 } = req.query;

        const timeSeries = await MarketData.getStockTimeSeries(symbol.toUpperCase(), parseInt(days));

        res.json({
            success: true,
            symbol,
            data: timeSeries,
            metadata: {
                totalRecords: timeSeries.length,
                days: parseInt(days)
            }
        });
    } catch (error) {
        console.error('Error fetching stock time series:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get market volatility analysis
router.get('/market-volatility', async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const volatility = await MarketData.getMarketVolatility(parseInt(days));

        res.json({
            success: true,
            data: volatility[0] || {},
            metadata: {
                days: parseInt(days),
                description: 'Market volatility statistics based on NIFTY index changes'
            }
        });
    } catch (error) {
        console.error('Error fetching market volatility:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get market statistics
router.get('/market-stats', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const stats = await MarketData.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalDataPoints: { $sum: 1 },
                    avgStocksPerSession: { $avg: '$totalStocks' },
                    avgGainers: { $avg: '$gainers' },
                    avgLosers: { $avg: '$losers' },
                    totalAlertsSet: { $sum: { $cond: ['$alertSent', 1, 0] } },
                    apiSuccessRate: {
                        $avg: { $cond: ['$apiResponse.success', 1, 0] }
                    },
                    avgResponseTime: { $avg: '$apiResponse.responseTime' },
                    marketSessions: { $addToSet: '$marketSession' }
                }
            }
        ]);

        // Get top gainers and losers
        const topMovers = await MarketData.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            { $unwind: '$stocks' },
            {
                $group: {
                    _id: '$stocks.symbol',
                    avgChange: { $avg: '$stocks.pChange' },
                    maxGain: { $max: '$stocks.pChange' },
                    maxLoss: { $min: '$stocks.pChange' },
                    avgVolume: { $avg: '$stocks.totalTradedVolume' },
                    dataPoints: { $sum: 1 }
                }
            },
            { $sort: { avgChange: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {},
                topPerformers: topMovers
            },
            metadata: {
                days: parseInt(days),
                generatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error fetching market stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get data for specific date range
router.get('/data-range', async (req, res) => {
    try {
        const { startDate, endDate, limit = 100 } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }

        const data = await MarketData.find({
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select('-stocks.yearHigh -stocks.yearLow -stocks.marketCap -stocks.pe -stocks.pb'); // Exclude heavy fields

        res.json({
            success: true,
            data,
            metadata: {
                totalRecords: data.length,
                dateRange: { startDate, endDate },
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching data range:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Export data for external ML tools
router.get('/export/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const { days = 30, symbols } = req.query;

        if (!['json', 'csv', 'jsonl'].includes(format)) {
            return res.status(400).json({
                success: false,
                error: 'Supported formats: json, csv, jsonl'
            });
        }

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const options = {
            startDate,
            endDate: new Date(),
            symbols: symbols ? symbols.split(',') : null
        };

        const data = await MarketData.getTrainingData(options);

        switch (format) {
            case 'csv':
                const csvHeaders = 'timestamp,symbol,lastPrice,change,pChange,volume,high,low,open,previousClose,marketSession,niftyChange,marketSentiment\n';
                const csvData = data.map(row =>
                    `${row.timestamp.toISOString()},${row.symbol},${row.lastPrice},${row.change},${row.pChange},${row.volume},${row.high},${row.low},${row.open},${row.previousClose},${row.marketSession},${row.niftyIndex.pChange},${row.marketSentiment}`
                ).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=market-data-${days}days.csv`);
                return res.send(csvHeaders + csvData);

            case 'jsonl':
                const jsonlData = data.map(row => JSON.stringify(row)).join('\n');
                res.setHeader('Content-Type', 'application/jsonl');
                res.setHeader('Content-Disposition', `attachment; filename=market-data-${days}days.jsonl`);
                return res.send(jsonlData);

            default:
                res.json({
                    success: true,
                    data,
                    metadata: {
                        totalRecords: data.length,
                        format,
                        days: parseInt(days)
                    }
                });
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 
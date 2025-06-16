/**
 * Market routes for LagoTrade API
 */

const express = require('express');
const {
    getMarketQuotes,
    getMarketIndices,
    searchInstruments,
    getHistoricalData
} = require('../controllers/market.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const axios = require('axios');
const User = require('../models/user.model');
const { sendEmail } = require('../utils/email.utils');
const UpstoxMarketService = require('../services/upstox-market.service');

const router = express.Router();

// Public routes
router.get('/quotes', async (req, res) => {
    try {
        const { instrumentKeys } = req.query;

        if (!instrumentKeys) {
            return res.status(400).json({
                success: false,
                message: 'Instrument keys are required'
            });
        }

        const quotes = await UpstoxMarketService.getFullMarketQuote(
            instrumentKeys.split(',')
        );

        res.status(200).json({
            success: true,
            data: quotes
        });
    } catch (error) {
        console.error('Market Quote Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market quotes',
            error: error.message
        });
    }
});

router.get('/indices', getMarketIndices);
router.get('/search', searchInstruments);

// NSE pre-open market data
router.get('/nse-pre-open', async (req, res) => {
    try {
        const key = req.query.key || 'NIFTY'; // Default to NIFTY if no key provided
        const response = await axios.get(`https://www.nseindia.com/api/market-data-pre-open?key=${key}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.nseindia.com/'
            }
        });

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching NSE pre-open data:', error);

        // Return mock data if real API fails
        const mockPreOpenData = generateMockPreOpenData(key);
        return res.status(200).json(mockPreOpenData);
    }
});

// Generate mock NSE pre-open market data
function generateMockPreOpenData(indexType) {
    const lastUpdateTime = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    // Different stocks based on index type
    let stocks = [];

    if (indexType === 'NIFTY') {
        stocks = [
            createMockStock("EICHERMOT", "Eicher Motors", 5500.00, 53.50, 0.98, 5446.50, 13680, 7.52, 74655.45, 5906.50, 4253.85),
            createMockStock("BHARTIARTL", "Bharti Airtel", 1849.90, 15.70, 0.86, 1834.20, 169833, 31.42, 491725.26, 1917.00, 1219.05),
            createMockStock("HCLTECH", "HCL Technologies", 1650.00, 12.30, 0.75, 1637.70, 36812, 6.07, 173619.87, 2012.20, 1235.00),
            createMockStock("BEL", "Bharat Electronics", 346.50, 2.15, 0.62, 344.35, 349915, 12.12, 123047.22, 346.00, 225.75),
            createMockStock("LT", "Larsen & Toubro", 3594.00, 20.90, 0.58, 3573.10, 2552, 0.92, 418663.36, 3963.50, 2965.30),
            createMockStock("SBIN", "State Bank of India", 804.45, 3.75, 0.47, 800.70, 22726, 1.83, 307440.99, 912.00, 680.00),
            createMockStock("SHRIRAMFIN", "Shriram Finance", 654.80, 2.85, 0.44, 651.95, 16885, 1.11, 90868.02, 730.45, 438.60),
            createMockStock("TCS", "Tata Consultancy Services", 3564.00, 15.30, 0.43, 3548.70, 16434, 5.86, 361279.52, 4592.25, 3056.05),
            createMockStock("KOTAKBANK", "Kotak Mahindra Bank", 1748.95, 7.20, 0.41, 1741.75, 18325, 3.21, 235678.92, 1957.30, 1631.50),
            createMockStock("RELIANCE", "Reliance Industries", 2892.00, 11.55, 0.40, 2880.45, 126580, 36.60, 1958642.30, 2970.10, 2180.20),
            createMockStock("HINDUNILVR", "Hindustan Unilever", 2347.90, -3.70, -0.16, 2351.60, 14256, 3.35, 551689.56, 2768.95, 2218.80),
            createMockStock("ICICIBANK", "ICICI Bank", 1011.60, -5.80, -0.57, 1017.40, 83562, 8.45, 708812.00, 1123.60, 825.75),
            createMockStock("HDFCBANK", "HDFC Bank", 1545.50, -9.30, -0.60, 1554.80, 91245, 14.11, 863456.25, 1757.80, 1460.25),
            createMockStock("INFY", "Infosys", 1609.50, -10.20, -0.63, 1619.70, 37215, 5.99, 668756.25, 1718.45, 1215.45),
            createMockStock("TATAMOTORS", "Tata Motors", 924.60, -6.40, -0.69, 931.00, 128964, 11.93, 448957.35, 1023.75, 630.00)
        ];
    } else if (indexType === 'BANKNIFTY') {
        stocks = [
            createMockStock("KOTAKBANK", "Kotak Mahindra Bank", 1748.95, 7.20, 0.41, 1741.75, 18325, 3.21, 235678.92, 1957.30, 1631.50),
            createMockStock("SBIN", "State Bank of India", 804.45, 3.75, 0.47, 800.70, 22726, 1.83, 307440.99, 912.00, 680.00),
            createMockStock("AUBANK", "AU Small Finance Bank", 695.35, 3.25, 0.47, 692.10, 12568, 0.87, 46578.45, 805.60, 580.25),
            createMockStock("FEDERALBNK", "Federal Bank", 152.80, 0.65, 0.43, 152.15, 98245, 1.50, 32145.75, 165.90, 126.85),
            createMockStock("PNB", "Punjab National Bank", 89.50, 0.30, 0.34, 89.20, 286405, 2.56, 98765.42, 120.35, 73.65),
            createMockStock("BANDHANBNK", "Bandhan Bank", 194.55, 0.55, 0.28, 194.00, 58642, 1.14, 31345.62, 254.90, 182.30),
            createMockStock("AXISBANK", "Axis Bank", 1128.30, -0.90, -0.08, 1129.20, 45682, 5.15, 347856.85, 1243.95, 945.25),
            createMockStock("INDUSINDBK", "IndusInd Bank", 1412.20, -1.20, -0.08, 1413.40, 23685, 3.34, 109756.45, 1690.35, 1014.75),
            createMockStock("RBLBANK", "RBL Bank", 246.35, -0.35, -0.14, 246.70, 87642, 2.16, 14789.65, 298.75, 165.20),
            createMockStock("ICICIBANK", "ICICI Bank", 1011.60, -5.80, -0.57, 1017.40, 83562, 8.45, 708812.00, 1123.60, 825.75),
            createMockStock("HDFCBANK", "HDFC Bank", 1545.50, -9.30, -0.60, 1554.80, 91245, 14.11, 863456.25, 1757.80, 1460.25),
            createMockStock("IDFCFIRSTB", "IDFC First Bank", 86.35, -0.55, -0.63, 86.90, 198745, 1.72, 56784.35, 96.40, 68.55)
        ];
    } else if (indexType === 'FINNIFTY') {
        stocks = [
            createMockStock("SHRIRAMFIN", "Shriram Finance", 654.80, 2.85, 0.44, 651.95, 16885, 1.11, 90868.02, 730.45, 438.60),
            createMockStock("KOTAKBANK", "Kotak Mahindra Bank", 1748.95, 7.20, 0.41, 1741.75, 18325, 3.21, 235678.92, 1957.30, 1631.50),
            createMockStock("SBIN", "State Bank of India", 804.45, 3.75, 0.47, 800.70, 22726, 1.83, 307440.99, 912.00, 680.00),
            createMockStock("BAJAJFINSV", "Bajaj Finserv", 1574.65, 5.45, 0.35, 1569.20, 12356, 1.95, 251345.75, 1748.95, 1365.50),
            createMockStock("HDFC", "HDFC Ltd", 3156.40, 8.80, 0.28, 3147.60, 8965, 2.83, 578964.35, 3460.75, 2860.25),
            createMockStock("ICICIGI", "ICICI Lombard", 1589.30, 3.45, 0.22, 1585.85, 4532, 0.72, 78123.45, 1695.60, 1275.40),
            createMockStock("SBILIFE", "SBI Life Insurance", 1412.75, 2.30, 0.16, 1410.45, 7854, 1.11, 141256.85, 1495.30, 1092.05),
            createMockStock("HDFCLIFE", "HDFC Life Insurance", 654.15, 0.85, 0.13, 653.30, 23564, 1.54, 140587.65, 720.95, 572.80),
            createMockStock("MUTHOOTFIN", "Muthoot Finance", 1398.40, -0.70, -0.05, 1399.10, 3265, 0.46, 56245.95, 1641.00, 1182.15),
            createMockStock("AXISBANK", "Axis Bank", 1128.30, -0.90, -0.08, 1129.20, 45682, 5.15, 347856.85, 1243.95, 945.25),
            createMockStock("ICICIBANK", "ICICI Bank", 1011.60, -5.80, -0.57, 1017.40, 83562, 8.45, 708812.00, 1123.60, 825.75),
            createMockStock("HDFCBANK", "HDFC Bank", 1545.50, -9.30, -0.60, 1554.80, 91245, 14.11, 863456.25, 1757.80, 1460.25)
        ];
    }

    // Calculate summary data
    let advances = 0, declines = 0, unchanged = 0;
    stocks.forEach(stock => {
        if (stock.metadata.change > 0) advances++;
        else if (stock.metadata.change < 0) declines++;
        else unchanged++;
    });

    return stocks;
}

// Helper to create a mock stock entry for pre-open market
function createMockStock(symbol, name, iep, change, pChange, previousClose, finalQuantity, totalTurnover, marketCap, yearHigh, yearLow) {
    const totalTurnoverCrores = totalTurnover * 1_00_00_000;

    return {
        metadata: {
            symbol: symbol,
            identifier: symbol,
            lastPrice: iep,
            change: change,
            pChange: pChange,
            previousClose: previousClose,
            finalQuantity: finalQuantity,
            totalTurnover: totalTurnoverCrores,
            marketCap: marketCap * 1_00_00_000,
            yearHigh: yearHigh,
            yearLow: yearLow,
            iep: iep
        },
        detail: {
            preOpenMarket: {
                preopen: [
                    { price: iep, buyQty: Math.floor(finalQuantity * 0.6), sellQty: Math.floor(finalQuantity * 0.4), iep: true }
                ],
                IEP: iep,
                totalTradedVolume: finalQuantity,
                finalPrice: iep,
                finalQuantity: finalQuantity,
                lastUpdateTime: new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }),
                totalSellQuantity: Math.floor(finalQuantity * 0.4),
                totalBuyQuantity: Math.floor(finalQuantity * 0.6),
                Change: change,
                perChange: pChange,
                prevClose: previousClose
            }
        }
    };
}

// Mock data endpoints for charts
router.get('/mock/index-data', (req, res) => {
    const indexData = [
        { date: "May 1", nifty: 22400, sensex: 73900, bankNifty: 48100 },
        { date: "May 5", nifty: 22680, sensex: 74600, bankNifty: 48500 },
        { date: "May 10", nifty: 22450, sensex: 74100, bankNifty: 48200 },
        { date: "May 15", nifty: 22750, sensex: 75300, bankNifty: 48700 },
        { date: "May 20", nifty: 22950, sensex: 75800, bankNifty: 49100 },
        { date: "May 25", nifty: 23100, sensex: 76200, bankNifty: 49400 },
        { date: "May 30", nifty: 23450, sensex: 77100, bankNifty: 49900 },
    ];

    res.status(200).json(indexData);
});

router.get('/mock/sector-performance', (req, res) => {
    const sectorPerformance = [
        { name: "Banking", change: 1.2 },
        { name: "IT", change: -0.8 },
        { name: "Pharma", change: 0.5 },
        { name: "Auto", change: 2.3 },
        { name: "FMCG", change: -0.3 },
        { name: "Energy", change: 1.7 },
        { name: "Metal", change: -1.5 },
    ];

    res.status(200).json(sectorPerformance);
});

router.get('/mock/market-cap', (req, res) => {
    const marketCapData = [
        { name: "Large Cap", value: 65 },
        { name: "Mid Cap", value: 25 },
        { name: "Small Cap", value: 10 },
    ];

    res.status(200).json(marketCapData);
});

router.get('/mock/institutional-flows', (req, res) => {
    const institutionalFlowData = [
        { date: "May 14", fii: 1250, dii: 850 },
        { date: "May 15", fii: -750, dii: 1200 },
        { date: "May 16", fii: 450, dii: 300 },
        { date: "May 17", fii: -200, dii: 750 },
        { date: "May 18", fii: 800, dii: 200 },
        { date: "May 19", fii: 1100, dii: -150 },
        { date: "May 20", fii: 600, dii: 500 },
    ];

    res.status(200).json(institutionalFlowData);
});

router.get('/mock/derivatives', (req, res) => {
    const derivativesData = [
        { date: "May 14", callOI: 12500, putOI: 8500 },
        { date: "May 15", callOI: 13200, putOI: 9100 },
        { date: "May 16", callOI: 11800, putOI: 10200 },
        { date: "May 17", callOI: 12400, putOI: 11500 },
        { date: "May 18", callOI: 13500, putOI: 12200 },
        { date: "May 19", callOI: 14100, putOI: 12800 },
        { date: "May 20", callOI: 15200, putOI: 13100 },
    ];

    res.status(200).json(derivativesData);
});

router.get('/mock/market-breadth', (req, res) => {
    const marketBreadthData = [
        { date: "May 14", advance: 1250, decline: 850, unchanged: 150 },
        { date: "May 15", advance: 1050, decline: 1020, unchanged: 180 },
        { date: "May 16", advance: 1150, decline: 920, unchanged: 160 },
        { date: "May 17", advance: 980, decline: 1080, unchanged: 170 },
        { date: "May 18", advance: 1200, decline: 870, unchanged: 160 },
        { date: "May 19", advance: 1300, decline: 750, unchanged: 180 },
        { date: "May 20", advance: 1350, decline: 700, unchanged: 190 },
    ];

    res.status(200).json(marketBreadthData);
});

router.get('/mock/top-stocks', (req, res) => {
    const topIndianStocks = [
        { name: "Reliance", symbol: "RELIANCE", price: 2547.89, change: 1.24, volume: 4589000 },
        { name: "HDFC Bank", symbol: "HDFCBANK", price: 1547.12, change: 0.94, volume: 3250100 },
        { name: "TCS", symbol: "TCS", price: 3521.50, change: -0.77, volume: 1520500 },
        { name: "Infosys", symbol: "INFY", price: 1575.50, change: -1.06, volume: 2850200 },
        { name: "ICICI Bank", symbol: "ICICIBANK", price: 1010.75, change: 0.45, volume: 2150000 },
    ];

    res.status(200).json(topIndianStocks);
});

// Auth required for historical data
router.get('/historical', authMiddleware, async (req, res) => {
    try {
        const {
            instrumentKey,
            interval = '1day',
            fromDate,
            toDate
        } = req.query;

        if (!instrumentKey) {
            return res.status(400).json({
                success: false,
                message: 'Instrument key is required'
            });
        }

        const historicalData = await UpstoxMarketService.getHistoricalData(
            instrumentKey,
            interval,
            fromDate,
            toDate
        );

        res.status(200).json({
            success: true,
            data: historicalData
        });
    } catch (error) {
        console.error('Historical Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch historical market data',
            error: error.message
        });
    }
});

// New route to send emails to all users
router.post('/send-emails', async (req, res) => {
    try {
        const users = await User.find({});
        for (const user of users) {
            await sendEmail({
                to: user.email,
                subject: 'Profit shares above 1.5% by LagoTrade',
                // ...
            });
            // ...
        }
        res.status(200).json({ message: 'Emails sent successfully' });
    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({ error: 'Failed to send emails' });
    }
});

// Get top market data (gainers/losers) - protected route
router.get('/top-stocks', authMiddleware, async (req, res) => {
    try {
        const {
            exchange = 'NSE',
            segment = 'NIFTY_50',
            limit = 50
        } = req.query;

        const topStocks = await UpstoxMarketService.getTopMarketData({
            exchange,
            segment,
            limit: Number(limit)
        });

        res.status(200).json({
            success: true,
            data: topStocks
        });
    } catch (error) {
        console.error('Top Market Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top market data',
            error: error.message
        });
    }
});

module.exports = router; 
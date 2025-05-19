const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');

// NSE pre-open market data
router.get('/nse-pre-open', authenticate, async (req, res) => {
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
        return res.status(500).json({
            message: 'Failed to fetch NSE pre-open data',
            error: error.message
        });
    }
});

module.exports = router; 
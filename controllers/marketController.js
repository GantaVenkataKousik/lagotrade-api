const Market = require('../models/Market');

// Get all market symbols
exports.getSymbols = async (req, res) => {
    try {
        const { type, exchange } = req.query;
        const query = {};

        if (type) query.type = type;
        if (exchange) query.exchange = exchange;

        const symbols = await Market.find(query)
            .select('symbol name type exchange currentPrice priceChange')
            .sort({ symbol: 1 });

        res.json(symbols);
    } catch (error) {
        console.error('Get symbols error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get market data for a symbol
exports.getMarketData = async (req, res) => {
    try {
        const { symbol } = req.params;
        const marketData = await Market.findOne({ symbol });

        if (!marketData) {
            return res.status(404).json({ message: 'Symbol not found' });
        }

        res.json(marketData);
    } catch (error) {
        console.error('Get market data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update market data
exports.updateMarketData = async (req, res) => {
    try {
        const { symbol } = req.params;
        const {
            currentPrice,
            priceChange,
            volume,
            high24h,
            low24h,
            technicalIndicators
        } = req.body;

        const marketData = await Market.findOne({ symbol });
        if (!marketData) {
            return res.status(404).json({ message: 'Symbol not found' });
        }

        // Update fields
        if (currentPrice) marketData.currentPrice = currentPrice;
        if (priceChange) marketData.priceChange = priceChange;
        if (volume) marketData.volume = volume;
        if (high24h) marketData.high24h = high24h;
        if (low24h) marketData.low24h = low24h;
        if (technicalIndicators) {
            marketData.technicalIndicators = {
                ...marketData.technicalIndicators,
                ...technicalIndicators
            };
        }

        marketData.lastUpdated = new Date();
        await marketData.save();

        res.json(marketData);
    } catch (error) {
        console.error('Update market data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search symbols
exports.searchSymbols = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const symbols = await Market.find({
            $or: [
                { symbol: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ]
        })
            .select('symbol name type exchange currentPrice priceChange')
            .limit(10);

        res.json(symbols);
    } catch (error) {
        console.error('Search symbols error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get market overview
exports.getMarketOverview = async (req, res) => {
    try {
        const { type } = req.query;
        const query = type ? { type } : {};

        const overview = await Market.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$type',
                    totalSymbols: { $sum: 1 },
                    totalVolume: { $sum: '$volume' },
                    averagePrice: { $avg: '$currentPrice' },
                    topGainers: {
                        $push: {
                            symbol: '$symbol',
                            name: '$name',
                            priceChange: '$priceChange'
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: '$_id',
                    totalSymbols: 1,
                    totalVolume: 1,
                    averagePrice: 1,
                    topGainers: {
                        $slice: [
                            {
                                $sortArray: {
                                    input: '$topGainers',
                                    sortBy: { 'priceChange.percentage': -1 }
                                }
                            },
                            5
                        ]
                    }
                }
            }
        ]);

        res.json(overview);
    } catch (error) {
        console.error('Get market overview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 
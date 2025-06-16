const axios = require('axios');
const UpstoxMarketData = require('../models/upstox-market-data.model');

class UpstoxMarketService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.upstox.com/v2',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`
            }
        });
    }

    // Get full market quote for a single or multiple instruments
    async getFullMarketQuote(instrumentKeys) {
        try {
            // Ensure instrumentKeys is an array
            const keys = Array.isArray(instrumentKeys) ? instrumentKeys : [instrumentKeys];

            const response = await this.client.get('/market-quote/quotes', {
                params: {
                    instrument_key: keys.join(',')
                }
            });

            return this.processMarketQuotes(response.data.data);
        } catch (error) {
            console.error('Upstox Market Quote Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Process and store market quotes
    async processMarketQuotes(quotes) {
        const processedQuotes = [];

        for (const [instrumentKey, quoteData] of Object.entries(quotes)) {
            const marketQuote = new UpstoxMarketData({
                symbol: quoteData.symbol,
                instrumentKey: instrumentKey,
                exchange: instrumentKey.split(':')[0],
                ohlc: {
                    open: quoteData.ohlc.open,
                    high: quoteData.ohlc.high,
                    low: quoteData.ohlc.low,
                    close: quoteData.ohlc.close
                },
                lastPrice: quoteData.last_price,
                volume: quoteData.volume,
                depth: {
                    buy: quoteData.depth.buy.slice(0, 5),
                    sell: quoteData.depth.sell.slice(0, 5)
                },
                marketData: {
                    averagePrice: quoteData.average_price,
                    totalBuyQuantity: quoteData.total_buy_quantity,
                    totalSellQuantity: quoteData.total_sell_quantity,
                    openInterest: quoteData.oi,
                    netChange: quoteData.net_change,
                    percentChange: (quoteData.net_change / quoteData.ohlc.close) * 100,
                    lowerCircuitLimit: quoteData.lower_circuit_limit,
                    upperCircuitLimit: quoteData.upper_circuit_limit
                }
            });

            // Save to database
            await marketQuote.save();
            processedQuotes.push(marketQuote);
        }

        return processedQuotes;
    }

    // Get market data for top stocks or specific indices
    async getTopMarketData(options = {}) {
        const {
            exchange = 'NSE',
            segment = 'NIFTY_50',
            limit = 50
        } = options;

        try {
            const response = await this.client.get('/market-quote/top-gainers-losers', {
                params: {
                    exchange,
                    segment
                }
            });

            const topStocks = response.data.data.gainers.concat(response.data.data.losers)
                .slice(0, limit);

            // Get full quotes for top stocks
            const instrumentKeys = topStocks.map(stock => `${exchange}_EQ:${stock.symbol}`);
            return this.getFullMarketQuote(instrumentKeys);
        } catch (error) {
            console.error('Upstox Top Market Data Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Get historical data for a symbol
    async getHistoricalData(instrumentKey, interval = '1day', fromDate = null, toDate = null) {
        try {
            const params = {
                instrument_key: instrumentKey,
                interval
            };

            // Add optional date parameters
            if (fromDate) params.from_date = fromDate;
            if (toDate) params.to_date = toDate;

            const response = await this.client.get('/historical-candle', { params });
            return response.data.data;
        } catch (error) {
            console.error('Upstox Historical Data Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = new UpstoxMarketService(); 
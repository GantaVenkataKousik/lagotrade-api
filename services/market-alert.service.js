const cron = require('node-cron');
const axios = require('axios');
const { sendEmail } = require('../utils/email.utils');
const MarketData = require('../models/market-data.model');

// Create a custom axios instance for NSE
const nseAxios = axios.create({
    baseURL: 'https://www.nseindia.com',
    timeout: 15000,
    maxRedirects: 5
});

// Cookie jar to store session cookies
let nseCookies = '';

// Add delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to get NSE cookies with retry mechanism
async function getNSECookies(retryCount = 0) {
    try {
        // Add delay if this is a retry attempt
        if (retryCount > 0) {
            console.log(`⏳ Waiting ${retryCount * 5} seconds before retry...`);
            await delay(retryCount * 5000); // Exponential backoff
        }

        const response = await nseAxios.get('/', {
            headers: {
                'authority': 'www.nseindia.com',
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin'
            }
        });

        const cookies = response.headers['set-cookie'];
        if (cookies) {
            nseCookies = cookies.map(cookie => cookie.split(';')[0]).join('; ');
            console.log('🍪 NSE cookies refreshed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Failed to get NSE cookies (attempt ${retryCount + 1}):`, error.message);

        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
            return getNSECookies(retryCount + 1);
        }

        return false;
    }
}

// Target email addresses (hardcoded as requested)
const TARGET_EMAILS = [
    'koushikganta64@gmail.com',
    'tradersaikishore007@gmail.com'
];

// Helper to determine market session
function getMarketSession() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    if (hour < 9) return 'pre-market';
    if (hour === 9 && minute < 15) return 'pre-market';
    if ((hour === 9 && minute >= 15) || (hour > 9 && hour < 15) || (hour === 15 && minute <= 30)) return 'market-hours';
    if (hour === 15 && minute > 30) return 'post-market';
    return 'after-hours';
}

// Helper to format HTML for email
function formatStockList(stocks, color) {
    return stocks.map(s =>
        `<div style="color:${color};font-weight:bold;margin:5px 0;">
            ${s.metadata.symbol}: ${s.metadata.pChange}% (₹${s.metadata.lastPrice}) Change: ₹${s.metadata.change}
        </div>`
    ).join('');
}

async function storeMarketData(stocks, apiSuccess, responseTime, errorMessage = null, alertSent = false, alertReason = null) {
    try {
        // Handle empty stocks array
        if (!Array.isArray(stocks)) stocks = [];

        // Calculate basic stats even if stocks array is empty
        const totalStocks = stocks.length;
        const gainers = stocks.filter(stock => stock.metadata && stock.metadata.pChange > 0).length || 0;
        const losers = stocks.filter(stock => stock.metadata && stock.metadata.pChange < 0).length || 0;
        const unchanged = totalStocks - (gainers + losers);

        // Calculate total volume and average
        const volumes = stocks
            .filter(stock => stock.metadata && stock.metadata.totalTradedVolume)
            .map(stock => stock.metadata.totalTradedVolume);
        const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
        const avgVolume = totalVolume / (volumes.length || 1);

        const changes = stocks
            .filter(stock => stock.metadata && !isNaN(stock.metadata.pChange))
            .map(stock => stock.metadata.pChange);
        const avgChange = changes.length > 0 ? changes.reduce((sum, change) => sum + change, 0) / changes.length : 0;

        let marketSentiment = 'neutral';
        if (totalStocks > 0) {
            const gainersRatio = gainers / totalStocks;
            const losersRatio = losers / totalStocks;
            if (gainersRatio > 0.6) marketSentiment = 'bullish';
            else if (losersRatio > 0.6) marketSentiment = 'bearish';
        }

        const marketDataEntry = new MarketData({
            timestamp: new Date(),
            marketSession: getMarketSession(),
            niftyIndex: {
                value: 0,
                change: 0,
                pChange: avgChange || 0
            },
            totalStocks,
            gainers,
            losers,
            unchanged,
            stocks: stocks.map(stock => ({
                symbol: stock.metadata?.symbol || 'UNKNOWN',
                companyName: stock.metadata?.companyName || stock.metadata?.symbol || 'UNKNOWN',
                lastPrice: stock.metadata?.lastPrice || 0,
                change: stock.metadata?.change || 0,
                pChange: stock.metadata?.pChange || 0,
                previousClose: stock.metadata?.previousClose || 0,
                open: stock.metadata?.open || 0,
                dayHigh: stock.metadata?.dayHigh || 0,
                dayLow: stock.metadata?.dayLow || 0,
                totalTradedVolume: stock.metadata?.totalTradedVolume || 0,
                totalTradedValue: stock.metadata?.totalTradedValue || 0
            })),
            marketSentiment,
            totalVolume,
            avgVolume,
            alertSent,
            alertReason,
            dataSource: 'NSE',
            apiResponse: {
                success: apiSuccess,
                responseTime,
                errorMessage
            }
        });

        try {
            await marketDataEntry.save();
            console.log(`💾 Market data stored successfully - ${stocks.length} stocks, Session: ${getMarketSession()}`);
            return marketDataEntry;
        } catch (dbError) {
            console.error('❌ Failed to store market data in MongoDB:', dbError.message);
            // Return a simplified version of the data even if storage failed
            return {
                timestamp: new Date(),
                totalStocks,
                gainers,
                losers,
                marketSentiment,
                error: dbError.message
            };
        }
    } catch (error) {
        console.error('❌ Failed to prepare market data:', error.message);
        return null;
    }
}

async function sendMarketAlert() {
    const startTime = Date.now();
    let apiSuccess = false;
    let errorMessage = null;
    let stocks = [];

    try {
        console.log('🔄 Fetching NSE NIFTY 50 data...');

        // Refresh cookies if needed
        await getNSECookies();

        // Add a small delay after getting cookies
        await delay(2000);

        // Fetch REAL NSE NIFTY 50 data with updated headers
        const response = await nseAxios.get('/api/market-data-pre-open?key=NIFTY', {
            headers: {
                'authority': 'www.nseindia.com',
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'referer': 'https://www.nseindia.com/market-data/pre-open-market-cm-and-emerge-market',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'cookie': nseCookies,
                'priority': 'u=1, i'
            }
        });

        stocks = response.data.data || [];
        apiSuccess = true;
        const responseTime = Date.now() - startTime;

        console.log(`📊 Found ${stocks.length} REAL stocks from NSE NIFTY 50`);

        if (stocks.length === 0) {
            console.log('⚠️ No stock data received from NSE API');
            await storeMarketData([], false, responseTime, 'No stock data received', false, 'error');
            return;
        }

        // Filter stocks by percentage change (lowered thresholds to 0.5% for more alerts)
        const profitStocks = stocks.filter(stock => stock.metadata.pChange > 0.5);
        const lossStocks = stocks.filter(stock => stock.metadata.pChange < -0.5);

        console.log(`📈 Profit stocks (>0.5%): ${profitStocks.length}`);
        console.log(`📉 Loss stocks (<-0.5%): ${lossStocks.length}`);

        // Log the actual stocks found
        if (profitStocks.length > 0) {
            console.log('📈 Gainers:', profitStocks.map(s => `${s.metadata.symbol}: +${s.metadata.pChange}%`).join(', '));
        }
        if (lossStocks.length > 0) {
            console.log('📉 Losers:', lossStocks.map(s => `${s.metadata.symbol}: ${s.metadata.pChange}%`).join(', '));
        }

        // Always store market data for AI training (regardless of significant movements)
        const shouldSendAlert = profitStocks.length > 0 || lossStocks.length > 0;
        const alertReason = shouldSendAlert ? 'significant-movement' : 'scheduled';

        await storeMarketData(stocks, apiSuccess, responseTime, null, shouldSendAlert, alertReason);

        // Only send emails in production environment
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ Email alerts disabled - not in production environment');
            console.log('📊 Data stored for AI training purposes');
            return;
        }

        if (!shouldSendAlert) {
            console.log('ℹ️ No significant stock movements found (>0.5% or <-0.5%) - No email sent');
            return;
        }

        // Prepare email content
        let htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333; text-align: center;">NSE NIFTY 50 Market Alert</h2>
                <p style="color: #666; text-align: center;">Real-time market update from LagoTrade</p>
                <p style="color: #666; text-align: center; font-size: 14px;">Total stocks monitored: ${stocks.length}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
        `;

        let textBody = `NSE NIFTY 50 Market Alert\nReal-time market update from LagoTrade\nTotal stocks monitored: ${stocks.length}\n\n`;

        if (profitStocks.length > 0) {
            htmlBody += `
                <div style="margin: 20px 0;">
                    <h3 style="color: #28a745; margin-bottom: 10px;">🚀 Top Gainers (above +0.5%) - ${profitStocks.length} stocks</h3>
                    ${formatStockList(profitStocks, '#28a745')}
                </div>
            `;
            textBody += `Top Gainers (above +0.5%) - ${profitStocks.length} stocks:\n` +
                profitStocks.map(s => `${s.metadata.symbol}: +${s.metadata.pChange}% (₹${s.metadata.lastPrice})`).join('\n') + '\n\n';
        }

        if (lossStocks.length > 0) {
            htmlBody += `
                <div style="margin: 20px 0;">
                    <h3 style="color: #dc3545; margin-bottom: 10px;">📉 Top Losers (below -0.5%) - ${lossStocks.length} stocks</h3>
                    ${formatStockList(lossStocks, '#dc3545')}
                </div>
            `;
            textBody += `Top Losers (below -0.5%) - ${lossStocks.length} stocks:\n` +
                lossStocks.map(s => `${s.metadata.symbol}: ${s.metadata.pChange}% (₹${s.metadata.lastPrice})`).join('\n') + '\n\n';
        }

        htmlBody += `
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Alert generated at ${new Date().toLocaleString('en-IN')} IST<br>
                    Data source: NSE India (Real-time)<br>
                    Powered by LagoTrade
                </p>
            </div>
        `;

        textBody += `Alert generated at ${new Date().toLocaleString('en-IN')} IST\nData source: NSE India (Real-time)\nPowered by LagoTrade`;

        // Send email alerts to all target addresses
        for (const email of TARGET_EMAILS) {
            try {
                console.log(`📧 Sending REAL market alert to ${email}...`);
                const emailSent = await sendEmail({
                    to: email,
                    subject: `🔥 NSE NIFTY 50 LIVE Alert - ${profitStocks.length} Gainers, ${lossStocks.length} Losers`,
                    text: textBody,
                    html: htmlBody
                });

                if (emailSent) {
                    console.log(`✅ REAL market alert sent successfully to ${email}`);
                } else {
                    console.log(`❌ Failed to send market alert to ${email}`);
                }
            } catch (emailError) {
                console.log(`❌ Email error for ${email}:`, emailError.message);
            }
        }

    } catch (err) {
        console.error('❌ Market alert job failed:', err.message);
        errorMessage = err.message;
        const responseTime = Date.now() - startTime;

        // Store error data for analysis
        await storeMarketData(stocks, false, responseTime, errorMessage, false, 'error');

        // Only send error emails in production and for non-401 errors
        if (process.env.NODE_ENV === 'production' && (!err.response || err.response.status !== 401)) {
            // Send error notification emails for unexpected errors only
            for (const email of TARGET_EMAILS) {
                try {
                    await sendEmail({
                        to: email,
                        subject: 'LagoTrade Market Alert - Error',
                        text: `Market alert failed at ${new Date().toLocaleString('en-IN')} IST\nError: ${err.message}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px;">
                                <h3 style="color: #dc3545;">Market Alert Error</h3>
                                <p>The market alert failed at ${new Date().toLocaleString('en-IN')} IST</p>
                                <p><strong>Error:</strong> ${err.message}</p>
                            </div>
                        `
                    });
                    console.log(`📧 Error notification sent to ${email}`);
                } catch (emailError) {
                    console.error(`Failed to send error notification to ${email}:`, emailError.message);
                }
            }
        } else if (err.response && err.response.status === 401) {
            console.log('⚠️ NSE API authentication expired - this is normal, will retry next interval');
        } else {
            console.log('⚠️ Error email notifications disabled - not in production environment');
        }
    }
}

// Run every 2 minutes during market hours (9:00 AM to 4:00 PM, Monday to Friday)
cron.schedule('*/5 9-16 * * 1-5', () => {
    // Only run in production environment
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ Market alerts disabled - not in production environment');
        return;
    }

    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();

    // Only run during market hours: 9:00 AM to 4:00 PM
    if ((hour === 9 && min >= 0) || (hour > 9 && hour < 16) || (hour === 16 && min === 0)) {
        console.log(`🕐 Running market alert at ${now.toLocaleString('en-IN')} IST`);
        sendMarketAlert();
    }
});

// Special alerts
// Pre-market alert at 9:00 AM
cron.schedule('0 9 * * 1-5', () => {
    // Only run in production environment
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ Pre-market alert disabled - not in production environment');
        return;
    }
    console.log('🌅 Pre-market alert at 9:00 AM');
    sendMarketAlert();
});

// Post-market alert at 4:00 PM
cron.schedule('0 16 * * 1-5', () => {
    // Only run in production environment
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ Post-market alert disabled - not in production environment');
        return;
    }
    console.log('🌆 Post-market alert at 4:00 PM');
    sendMarketAlert();
});

// Export for manual testing
module.exports = { sendMarketAlert };

console.log('📊 NSE NIFTY 50 Market Alert Service initialized');
console.log('⏰ Alerts will run every 2 minutes during market hours (9:00 AM - 4:00 PM, Mon-Fri)');
console.log('🎯 Stock threshold: >0.5% gain or <-0.5% loss');
console.log('🏭 Environment check: Only runs in production (NODE_ENV=production)');
console.log(`📧 Alerts will be sent to: ${TARGET_EMAILS.join(', ')}`);
console.log(`🌍 Current environment: ${process.env.NODE_ENV || 'development'}`);

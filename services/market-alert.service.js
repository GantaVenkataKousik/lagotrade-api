const cron = require('node-cron');
const axios = require('axios');
const { sendEmail } = require('../utils/email.utils');

// Target email addresses (hardcoded as requested)
const TARGET_EMAILS = [
    'koushikganta64@gmail.com',
    'tradersaikishore007@gmail.com'
];

// Helper to format HTML for email
function formatStockList(stocks, color) {
    return stocks.map(s =>
        `<div style="color:${color};font-weight:bold;margin:5px 0;">
            ${s.metadata.symbol}: ${s.metadata.pChange > 0 ? '+' : ''}${s.metadata.pChange}% 
            (₹${s.metadata.lastPrice}) 
            <span style="color:#666;font-size:12px;">Change: ₹${s.metadata.change}</span>
        </div>`
    ).join('');
}

async function sendMarketAlert() {
    try {
        console.log('🔄 Fetching NSE NIFTY 50 data...');

        // Fetch REAL NSE NIFTY 50 data - NO MOCK DATA
        const response = await axios.get('https://www.nseindia.com/api/market-data-pre-open?key=NIFTY', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.nseindia.com/',
                'Origin': 'https://www.nseindia.com',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 15000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 300; // default
            }
        });

        const stocks = response.data.data || [];
        console.log(`📊 Found ${stocks.length} REAL stocks from NSE NIFTY 50`);

        if (stocks.length === 0) {
            console.log('⚠️ No stock data received from NSE API');
            return;
        }

        // Filter stocks by percentage change (lowered thresholds for more alerts)
        const profitStocks = stocks.filter(stock => stock.metadata.pChange > 1.0);
        const lossStocks = stocks.filter(stock => stock.metadata.pChange < -1.0);

        console.log(`📈 Profit stocks (>1%): ${profitStocks.length}`);
        console.log(`📉 Loss stocks (<-1%): ${lossStocks.length}`);

        // Log the actual stocks found
        if (profitStocks.length > 0) {
            console.log('📈 Gainers:', profitStocks.map(s => `${s.metadata.symbol}: +${s.metadata.pChange}%`).join(', '));
        }
        if (lossStocks.length > 0) {
            console.log('📉 Losers:', lossStocks.map(s => `${s.metadata.symbol}: ${s.metadata.pChange}%`).join(', '));
        }

        if (profitStocks.length === 0 && lossStocks.length === 0) {
            console.log('ℹ️ No significant stock movements found (>1% or <-1%)');
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
                    <h3 style="color: #28a745; margin-bottom: 10px;">🚀 Top Gainers (above +1.0%) - ${profitStocks.length} stocks</h3>
                    ${formatStockList(profitStocks, '#28a745')}
                </div>
            `;
            textBody += `Top Gainers (above +1.0%) - ${profitStocks.length} stocks:\n` +
                profitStocks.map(s => `${s.metadata.symbol}: +${s.metadata.pChange}% (₹${s.metadata.lastPrice})`).join('\n') + '\n\n';
        }

        if (lossStocks.length > 0) {
            htmlBody += `
                <div style="margin: 20px 0;">
                    <h3 style="color: #dc3545; margin-bottom: 10px;">📉 Top Losers (below -1.0%) - ${lossStocks.length} stocks</h3>
                    ${formatStockList(lossStocks, '#dc3545')}
                </div>
            `;
            textBody += `Top Losers (below -1.0%) - ${lossStocks.length} stocks:\n` +
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

        // Send error notification emails
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
    }
}

// Run every 5 minutes during market hours (9:00 AM to 4:00 PM, Monday to Friday)
cron.schedule('*/5 9-16 * * 1-5', () => {
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
    console.log('🌅 Pre-market alert at 9:00 AM');
    sendMarketAlert();
});

// Post-market alert at 4:00 PM
cron.schedule('0 16 * * 1-5', () => {
    console.log('🌆 Post-market alert at 4:00 PM');
    sendMarketAlert();
});

// Export for manual testing
module.exports = { sendMarketAlert };

console.log('📊 NSE NIFTY 50 Market Alert Service initialized');
console.log('⏰ Alerts will run every 5 minutes during market hours (9:00 AM - 4:00 PM, Mon-Fri)');
console.log(`📧 Alerts will be sent to: ${TARGET_EMAILS.join(', ')}`);

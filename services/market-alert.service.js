const cron = require('node-cron');
const axios = require('axios');
const { sendEmail } = require('../utils/email.utils');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Helper to format HTML for email
function formatStockList(stocks, color) {
    return stocks.map(s =>
        `<div style="color:${color};font-weight:bold">${s.metadata.symbol}: ${s.metadata.pChange}% (${s.metadata.lastPrice})</div>`
    ).join('');
}

async function sendMarketAlert() {
    try {
        const { data } = await axios.get('https://www.nseindia.com/api/market-data-pre-open?key=NIFTY');
        const stocks = data.data || [];
        const profitStocks = stocks.filter(stock => stock.metadata.pChange > 1.5);
        const lossStocks = stocks.filter(stock => stock.metadata.pChange < -1.5);

        if (profitStocks.length === 0 && lossStocks.length === 0) return;

        const users = await User.find({});
        for (const user of users) {
            let htmlBody = '';
            let textBody = '';
            if (profitStocks.length) {
                htmlBody += `<div><b>Profit Shares (above +1.5%):</b></div>${formatStockList(profitStocks, 'green')}`;
                textBody += 'Profit Shares (above +1.5%):\n' + profitStocks.map(s => `${s.metadata.symbol}: ${s.metadata.pChange}% (${s.metadata.lastPrice})`).join('\n');
            }
            if (profitStocks.length && lossStocks.length) {
                htmlBody += '<br><br>';
                textBody += '\n\n';
            }
            if (lossStocks.length) {
                htmlBody += `<div><b>Loss Shares (below -1.5%):</b></div>${formatStockList(lossStocks, 'red')}`;
                textBody += 'Loss Shares (below -1.5%):\n' + lossStocks.map(s => `${s.metadata.symbol}: ${s.metadata.pChange}% (${s.metadata.lastPrice})`).join('\n');
            }

            await sendEmail({
                to: user.email,
                subject: 'Profit shares above 1.5% by LagoTrade',
                text: textBody,
                html: htmlBody
            });

            // Notification message (plain text)
            let notifMsg = '';
            if (profitStocks.length) notifMsg += 'Profit: ' + profitStocks.map(s => s.metadata.symbol).join(', ');
            if (profitStocks.length && lossStocks.length) notifMsg += ' | ';
            if (lossStocks.length) notifMsg += 'Loss: ' + lossStocks.map(s => s.metadata.symbol).join(', ');

            await Notification.create({
                userId: user._id,
                message: notifMsg,
                type: 'market-alert',
                createdAt: new Date()
            });
        }
    } catch (err) {
        console.error('Market alert job failed:', err);
    }
}

// Every 5 min from 9:30 to 15:30
cron.schedule('*/5 9-15 * * 1-5', () => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    // Only run if after 9:30 and before 15:31
    if ((hour === 9 && min >= 30) || (hour > 9 && hour < 15) || (hour === 15 && min <= 30)) {
        sendMarketAlert();
    }
});

// Once at 9:15am
cron.schedule('15 9 * * 1-5', sendMarketAlert);

// Once at 3:45pm
cron.schedule('45 15 * * 1-5', sendMarketAlert);

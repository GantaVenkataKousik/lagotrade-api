const axios = require('axios');

// WhatsApp API configuration
const config = {
    phoneNumberId: '641304629066453',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    version: 'v22.0'
};

// Send a template message (for initial contact)
async function sendTemplateMessage(to, templateName, language = 'en_US', components = []) {
    try {
        const url = `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`;

        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: language
                },
                components
            }
        };

        const response = await axios({
            method: 'POST',
            url: url,
            data: data,
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('WhatsApp template message sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp template message:', error.response?.data || error.message);
        throw error;
    }
}

// Send a text message (after template engagement)
async function sendTextMessage(to, message) {
    try {
        const url = `https://graph.facebook.com/${config.version}/${config.phoneNumberId}/messages`;

        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        };

        const response = await axios({
            method: 'POST',
            url: url,
            data: data,
            headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('WhatsApp text message sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending WhatsApp text message:', error.response?.data || error.message);
        throw error;
    }
}

// Send trading alert
async function sendTradingAlert(to, { symbol, action, price, change, strategy }) {
    const message = `🚨 TRADING ALERT 🚨
📈 ${symbol}: ${action.toUpperCase()} @ ₹${price}
${change > 0 ? '▲' : '▼'} ${Math.abs(change)}%
Strategy: ${strategy}
Time: ${new Date().toLocaleTimeString()}`;

    return sendTextMessage(to, message);
}

// Send market summary
async function sendMarketSummary(to, { nifty, sensex, topGainers, topLosers }) {
    const message = `📊 MARKET SUMMARY 📊
NIFTY 50: ${nifty.value} ${nifty.change > 0 ? '▲' : '▼'} ${Math.abs(nifty.change)}%
SENSEX: ${sensex.value} ${sensex.change > 0 ? '▲' : '▼'} ${Math.abs(sensex.change)}%

🔝 Top Gainers:
${topGainers.map(stock => `- ${stock.symbol}: ▲ ${stock.change}%`).join('\n')}

⬇️ Top Losers:
${topLosers.map(stock => `- ${stock.symbol}: ▼ ${Math.abs(stock.change)}%`).join('\n')}`;

    return sendTextMessage(to, message);
}

module.exports = {
    sendTemplateMessage,
    sendTextMessage,
    sendTradingAlert,
    sendMarketSummary
}; 
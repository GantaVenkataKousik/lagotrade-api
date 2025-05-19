/**
 * WhatsApp Messaging Utilities for LagoTrade
 */

const axios = require('axios');

// Configure WhatsApp API credentials
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Send a WhatsApp message to a user
 * @param {string} to - Recipient's phone number (with country code, no + or spaces)
 * @param {string} text - Message text
 * @returns {Promise} - API response
 */
exports.sendWhatsAppMessage = async (to, text) => {
    try {
        // Validate phone number format
        const cleanPhone = to.replace(/\D/g, '');

        if (!cleanPhone || cleanPhone.length < 10) {
            throw new Error('Invalid phone number format');
        }

        // Format API endpoint
        const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

        // Prepare message payload
        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
                preview_url: false,
                body: text
            }
        };

        // Set headers with access token
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        };

        // Send request to WhatsApp API
        const response = await axios.post(url, data, config);
        return response.data;
    } catch (error) {
        console.error('WhatsApp API Error:', error);
        throw error;
    }
};

/**
 * Send a stock update message via WhatsApp
 * @param {string} to - Recipient's phone number
 * @param {object} stockUpdate - Stock update data
 * @returns {Promise} - API response
 */
exports.sendStockUpdateWhatsApp = async (to, stockUpdate) => {
    const { symbol, price, change, percentChange } = stockUpdate;

    const changeSymbol = change >= 0 ? '↑' : '↓';
    const changeText = `${changeSymbol} ${Math.abs(change).toFixed(2)} (${Math.abs(percentChange).toFixed(2)}%)`;

    const message = `
*LagoTrade Stock Alert*

Symbol: *${symbol}*
Current Price: ₹${price.toFixed(2)}
Change: ${changeText}

_Tap to view more details in the app._
`;

    return await exports.sendWhatsAppMessage(to, message);
};

module.exports = exports; 
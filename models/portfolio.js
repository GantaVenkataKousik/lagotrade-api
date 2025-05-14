/**
 * Portfolio Model
 * 
 * This model provides methods to interact with portfolio holdings in PostgreSQL.
 */

const db = require('../utils/postgres');

/**
 * Get all portfolio holdings for a user
 * @param {number} userId - PostgreSQL user ID
 * @returns {Promise<Array>} Array of portfolio holdings
 */
async function getHoldings(userId) {
    try {
        const result = await db.query(
            'SELECT * FROM portfolio_holdings WHERE user_id = $1 ORDER BY symbol ASC',
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching portfolio holdings:', error);
        throw new Error('Failed to fetch portfolio holdings');
    }
}

/**
 * Get a specific holding by symbol
 * @param {number} userId - PostgreSQL user ID
 * @param {string} symbol - Stock symbol
 * @param {string} exchange - Exchange identifier
 * @returns {Promise<Object|null>} Holding object or null if not found
 */
async function getHoldingBySymbol(userId, symbol, exchange) {
    try {
        const result = await db.query(
            'SELECT * FROM portfolio_holdings WHERE user_id = $1 AND symbol = $2 AND exchange = $3',
            [userId, symbol, exchange]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error fetching holding by symbol:', error);
        throw new Error(`Failed to fetch holding for ${symbol}`);
    }
}

/**
 * Add or update a portfolio holding
 * @param {Object} holding - Holding data
 * @returns {Promise<Object>} Created or updated holding
 */
async function upsertHolding(holding) {
    try {
        // Check if holding already exists
        const existingHolding = await getHoldingBySymbol(
            holding.user_id,
            holding.symbol,
            holding.exchange
        );

        if (existingHolding) {
            // Update existing holding
            const result = await db.query(
                `UPDATE portfolio_holdings 
         SET quantity = $1, average_price = $2, current_price = $3,
         investment_value = $4, current_value = $5, pnl = $6, 
         pnl_percent = $7, last_updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
                [
                    holding.quantity,
                    holding.average_price,
                    holding.current_price,
                    holding.investment_value,
                    holding.current_value,
                    holding.pnl,
                    holding.pnl_percent,
                    existingHolding.id
                ]
            );
            return result.rows[0];
        } else {
            // Insert new holding
            const result = await db.query(
                `INSERT INTO portfolio_holdings 
         (user_id, symbol, exchange, quantity, average_price, current_price,
         investment_value, current_value, pnl, pnl_percent, last_updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING *`,
                [
                    holding.user_id,
                    holding.symbol,
                    holding.exchange,
                    holding.quantity,
                    holding.average_price,
                    holding.current_price,
                    holding.investment_value,
                    holding.current_value,
                    holding.pnl,
                    holding.pnl_percent
                ]
            );
            return result.rows[0];
        }
    } catch (error) {
        console.error('Error upserting portfolio holding:', error);
        throw new Error('Failed to save portfolio holding');
    }
}

/**
 * Delete a portfolio holding
 * @param {number} userId - PostgreSQL user ID
 * @param {string} symbol - Stock symbol
 * @param {string} exchange - Exchange identifier
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function deleteHolding(userId, symbol, exchange) {
    try {
        const result = await db.query(
            'DELETE FROM portfolio_holdings WHERE user_id = $1 AND symbol = $2 AND exchange = $3 RETURNING id',
            [userId, symbol, exchange]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error deleting portfolio holding:', error);
        throw new Error(`Failed to delete holding for ${symbol}`);
    }
}

/**
 * Get portfolio summary
 * @param {number} userId - PostgreSQL user ID
 * @returns {Promise<Object>} Portfolio summary object
 */
async function getPortfolioSummary(userId) {
    try {
        const result = await db.query(
            `SELECT 
        COUNT(*) as total_holdings,
        SUM(investment_value) as total_investment,
        SUM(current_value) as total_current_value,
        SUM(pnl) as total_pnl,
        CASE 
          WHEN SUM(investment_value) > 0 
          THEN (SUM(current_value) - SUM(investment_value)) / SUM(investment_value) * 100
          ELSE 0
        END as total_pnl_percent
      FROM portfolio_holdings 
      WHERE user_id = $1`,
            [userId]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error fetching portfolio summary:', error);
        throw new Error('Failed to fetch portfolio summary');
    }
}

module.exports = {
    getHoldings,
    getHoldingBySymbol,
    upsertHolding,
    deleteHolding,
    getPortfolioSummary
}; 
/**
 * PostgreSQL Database Utility Module
 * 
 * Provides a centralized interface for PostgreSQL database operations.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config();

// Create a singleton connection pool to be reused by the application
const pool = process.env.POSTGRES_URI
    ? new Pool({ connectionString: process.env.POSTGRES_URI })
    : null;

// Log connection status
if (pool) {
    console.log('PostgreSQL connection pool initialized');

    // Handle connection errors
    pool.on('error', (err) => {
        console.error('Unexpected PostgreSQL error:', err);
    });
} else {
    console.log('PostgreSQL connection not configured, some features may be unavailable');
}

/**
 * Execute a query with optional parameters
 * @param {string} text - The SQL query text
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
    if (!pool) {
        throw new Error('PostgreSQL connection not configured');
    }

    try {
        const start = Date.now();
        const result = await pool.query(text, params);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[PG Query] ${text} | ${duration}ms | ${result.rowCount} rows`);
        }

        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    }
}

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Function that receives a client and executes queries
 * @returns {Promise<any>} Result of the transaction
 */
async function transaction(callback) {
    if (!pool) {
        throw new Error('PostgreSQL connection not configured');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Close the connection pool
 * @returns {Promise<void>}
 */
async function close() {
    if (pool) {
        await pool.end();
        console.log('PostgreSQL connection pool closed');
    }
}

/**
 * Check if PostgreSQL is configured and connected
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
async function isConnected() {
    if (!pool) {
        return false;
    }

    try {
        const result = await pool.query('SELECT NOW()');
        return result && result.rows && result.rows.length > 0;
    } catch (error) {
        console.error('Connection check failed:', error);
        return false;
    }
}

module.exports = {
    query,
    transaction,
    close,
    isConnected,
    pool
}; 
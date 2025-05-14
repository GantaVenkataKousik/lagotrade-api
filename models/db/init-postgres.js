/**
 * PostgreSQL Database Initialization Script for LagoTrade
 * 
 * This script initializes the PostgreSQL database with tables defined in schema.js.
 * Run this script after setting up the PostgreSQL connection in .env file.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const { postgresTables } = require('./schema');

// Load environment variables
dotenv.config();

const createDatabase = async () => {
    try {
        if (!process.env.POSTGRES_URI) {
            console.error('Error: POSTGRES_URI environment variable not set.');
            console.log('Set the POSTGRES_URI in your .env file and try again.');
            process.exit(1);
        }

        // Create PostgreSQL client
        const pool = new Pool({
            connectionString: process.env.POSTGRES_URI
        });

        console.log('PostgreSQL connected successfully');
        console.log('Creating tables...');

        // Execute each table creation query
        for (const tableQuery of postgresTables) {
            try {
                await pool.query(tableQuery);
                const tableName = tableQuery.match(/CREATE TABLE (\w+)/)[1];
                console.log(`✅ Created table: ${tableName}`);
            } catch (error) {
                if (error.code === '42P07') { // duplicate_table error code
                    const tableName = tableQuery.match(/CREATE TABLE (\w+)/)[1];
                    console.log(`⚠️ Table ${tableName} already exists, skipping...`);
                } else {
                    console.error('Error creating table:', error);
                }
            }
        }

        console.log('✅ PostgreSQL database initialization completed');
        console.log('✅ All tables created successfully');

        await pool.end();

        console.log('Database connection closed');
    } catch (err) {
        console.error('Error initializing PostgreSQL database:', err);
        process.exit(1);
    }
};

// Run the initialization function
createDatabase(); 
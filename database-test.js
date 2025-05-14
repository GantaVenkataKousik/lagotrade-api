/**
 * Test database connections for LagoTrade
 * Run with: node database-test.js
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test PostgreSQL connection
async function testPostgreSQL() {
    console.log('\n=== PostgreSQL Connection Test ===');

    try {
        // Create connection
        const pgPool = new Pool({
            user: 'postgres',
            password: 'kousik123',
            host: 'localhost',
            port: 5432,
            database: 'postgres'
        });

        console.log('Connecting to PostgreSQL...');

        // Test connection
        const client = await pgPool.connect();
        console.log('✅ PostgreSQL connection successful!');

        // Test a simple query
        const result = await client.query('SELECT NOW() as time');
        console.log(`Server time: ${result.rows[0].time}`);

        // Release client
        client.release();

        // Close pool
        await pgPool.end();

        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:');
        console.error(error);
        return false;
    }
}

// Test Redis connection
async function testRedis() {
    console.log('\n=== Redis Connection Test ===');

    try {
        // Create Redis client
        const redisOptions = {
            host: 'localhost',
            port: 6379,
            retryStrategy: (times) => {
                if (times > 3) return null; // Stop retrying after 3 attempts
                return Math.min(times * 100, 1000); // Retry in 100ms, 200ms, 300ms
            },
            connectTimeout: 5000, // 5 seconds timeout
        };

        console.log('Connecting to Redis...');

        const redisClient = new Redis(redisOptions);

        // Wait for connection or error
        return new Promise((resolve) => {
            redisClient.on('connect', async () => {
                console.log('✅ Redis connection successful!');

                // Test setting and getting a key
                await redisClient.set('test_key', 'Hello from LagoTrade');
                const value = await redisClient.get('test_key');
                console.log(`Test value: ${value}`);

                // Clean up
                await redisClient.del('test_key');
                await redisClient.quit();

                resolve(true);
            });

            redisClient.on('error', (err) => {
                console.error('❌ Redis connection failed:');
                console.error(err);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('❌ Redis connection failed:');
        console.error(error);
        return false;
    }
}

// Run the tests
async function runTests() {
    console.log('Running LagoTrade Database Connection Tests...');

    const pgResult = await testPostgreSQL();
    const redisResult = await testRedis();

    console.log('\n=== Summary ===');
    console.log(`PostgreSQL: ${pgResult ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Redis: ${redisResult ? '✅ Connected' : '❌ Failed'}`);

    if (!pgResult || !redisResult) {
        console.log('\n=== Troubleshooting ===');
        if (!pgResult) {
            console.log('PostgreSQL Troubleshooting:');
            console.log('1. Ensure PostgreSQL service is running');
            console.log('2. Verify credentials (username: postgres, password: kousik123)');
            console.log('3. Check for local installations with: psql -U postgres');
        }

        if (!redisResult) {
            console.log('Redis Troubleshooting:');
            console.log('1. Ensure Redis server is running locally');
            console.log('2. Install Redis if needed:');
            console.log('   - Windows: Use https://github.com/microsoftarchive/redis/releases');
            console.log('   - Linux: sudo apt install redis-server');
            console.log('   - macOS: brew install redis');
            console.log('3. Start Redis server:');
            console.log('   - Windows: Start the Redis service');
            console.log('   - Linux/macOS: redis-server');
        }
    }
}

// Execute tests
runTests(); 
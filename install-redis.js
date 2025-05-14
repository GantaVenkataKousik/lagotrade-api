/**
 * Simple Redis installer and starter for LagoTrade
 * This script installs and starts a local Redis server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== LagoTrade Redis Setup ===');

// Install Redis server module if not already installed
try {
    console.log('Installing redis-server module...');
    execSync('npm install redis-server --no-save', { stdio: 'inherit' });
    console.log('✅ Redis server module installed');
} catch (error) {
    console.error('❌ Failed to install redis-server module:', error.message);
    process.exit(1);
}

// Start Redis server
try {
    console.log('Starting Redis server...');
    const RedisServer = require('redis-server');

    // Create a Redis server instance
    const redisServer = new RedisServer({
        port: 6379,
        bin: process.platform === 'win32' ? undefined : '/usr/local/bin/redis-server'
    });

    // Start the server
    redisServer.open()
        .then(() => {
            console.log('✅ Redis server is running on port 6379');
            console.log('📝 To connect to Redis:');
            console.log('   - Host: localhost');
            console.log('   - Port: 6379');
            console.log('   - No password required for local development');
            console.log('\nPress Ctrl+C to stop the Redis server');
        })
        .catch((err) => {
            console.error('❌ Failed to start Redis server:', err.message);
            process.exit(1);
        });
} catch (error) {
    console.error('❌ Error starting Redis server:', error.message);
    process.exit(1);
} 
// Simple script to test MongoDB connection
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Hard-coded connection string for testing
const MONGO_URI = "mongodb+srv://gvk:gvk123@gvk.orbwd1t.mongodb.net/trade?retryWrites=true&w=majority&appName=gvk";

async function testConnection() {
    console.log('Starting MongoDB connection test...');

    // Test native MongoDB driver
    try {
        console.log('Testing with MongoDB native driver...');
        const client = new MongoClient(MONGO_URI);
        await client.connect();

        // Ping to confirm connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ MongoDB native driver connected successfully!");

        // List databases
        const dbList = await client.db().admin().listDatabases();
        console.log("Available databases:");
        dbList.databases.forEach(db => console.log(` - ${db.name}`));

        await client.close();
    } catch (err) {
        console.error('❌ MongoDB native driver connection failed:', err);
    }

    // Test Mongoose
    try {
        console.log('\nTesting with Mongoose...');
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        console.log(`✅ Mongoose connected successfully! Connection state: ${mongoose.connection.readyState}`);
        await mongoose.connection.close();
        console.log('Mongoose connection closed.');
    } catch (err) {
        console.error('❌ Mongoose connection failed:', err);
    }
}

// Run the test
testConnection()
    .then(() => console.log('Connection test complete'))
    .catch(err => console.error('Test failed:', err))
    .finally(() => process.exit(0)); 
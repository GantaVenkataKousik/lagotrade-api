const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Connection string for MongoDB Atlas
const MONGO_URI = "mongodb+srv://gvk:gvk123@gvk.orbwd1t.mongodb.net/trade?retryWrites=true&w=majority&appName=gvk";

// Function to test MongoDB connection
async function testMongoConnection() {
    console.log('Testing MongoDB Atlas connection...');

    try {
        // Test connection with MongoDB native driver
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log('✅ MongoDB native driver connected successfully!');

        // Get database info
        const dbInfo = await client.db().admin().listDatabases();
        console.log('Available databases:', dbInfo.databases.map(db => db.name).join(', '));

        await client.close();

        // Test connection with Mongoose
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000
        });

        console.log('✅ Mongoose connected successfully!');
        console.log('Mongoose connection state:', mongoose.connection.readyState);

        await mongoose.disconnect();
        console.log('Mongoose disconnected');

        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        return false;
    }
}

// Function to test the login API using built-in fetch (available in Node.js v18+)
async function testLoginApi() {
    console.log('\nTesting login API...');

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'venkatakousikcse@gmail.com',
                password: 'kousik123'
            })
        });

        const data = await response.json();
        console.log('Login API Response:', data);

        return data;
    } catch (err) {
        console.error('❌ Login API error:', err);
        return null;
    }
}

// Run the tests
async function runTests() {
    const connectionSuccess = await testMongoConnection();

    if (connectionSuccess) {
        console.log('\nMongoDB connection successful, now testing API');
        await testLoginApi();
    } else {
        console.log('\nSkipping API test due to MongoDB connection failure');
    }
}

runTests().catch(console.error);

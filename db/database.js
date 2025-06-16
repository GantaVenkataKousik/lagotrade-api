const mongoose = require('mongoose');
const config = require('../config');

let isConnectedFlag = false;

const connect = async (uri = config.mongodb.uri) => {
    try {
        if (!uri) {
            throw new Error('MongoDB URI is not provided');
        }

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        await mongoose.connect(uri, options);

        console.log('✅ MongoDB connected successfully');
        isConnectedFlag = true;

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB');
            isConnectedFlag = false;
        });

        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
            isConnectedFlag = true;
        });

        return { isConnected: true };
    } catch (error) {
        console.error('MongoDB connection error:', error);
        isConnectedFlag = false;
        return { isConnected: false, error };
    }
};

const disconnect = async () => {
    try {
        await mongoose.disconnect();
        isConnectedFlag = false;
        console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};

const isConnected = () => isConnectedFlag;

const ensureConnection = async (req, res, next) => {
    if (!isConnectedFlag) {
        try {
            await connect();
        } catch (error) {
            console.error('Failed to reconnect to MongoDB:', error);
        }
    }
    next();
};

module.exports = {
    connect,
    disconnect,
    isConnected,
    ensureConnection
}; 
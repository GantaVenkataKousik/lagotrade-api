module.exports = {
    mongodb: {
        uri: 'mongodb+srv://gvk:gvk123@gvk.orbwd1t.mongodb.net/trade'
    },
    jwt: {
        secret: 'your-super-secret-jwt-key-for-development-123',
        refreshSecret: 'your-super-secret-refresh-key-for-development-123',
        expire: '30d',
        refreshExpire: '7d'
    },
    server: {
        port: 5000,
        env: 'development'
    }
}; 
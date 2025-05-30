const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🔍 Environment Configuration Check');
console.log('=====================================');

console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'undefined (defaults to development)'}`);
console.log(`📧 EMAIL_HOST: ${process.env.EMAIL_HOST || 'undefined'}`);
console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER || 'undefined'}`);
console.log(`📧 EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***set***' : 'undefined'}`);
console.log(`📧 EMAIL_PORT: ${process.env.EMAIL_PORT || 'undefined'}`);
console.log(`📧 EMAIL_FROM: ${process.env.EMAIL_FROM || 'undefined'}`);

console.log('\n📊 Market Alert Configuration:');
console.log(`⏰ Cron Schedule: Every 5 minutes during market hours (9:00 AM - 4:00 PM, Mon-Fri)`);
console.log(`🎯 Stock Threshold: >0.5% gain or <-0.5% loss`);
console.log(`📧 Target Emails: koushikganta64@gmail.com, tradersaikishore007@gmail.com`);

console.log('\n🏭 Production Mode Behavior:');
if (process.env.NODE_ENV === 'production') {
    console.log('✅ PRODUCTION MODE - Emails will be sent');
    console.log('✅ Market data will be stored for AI training');
    console.log('✅ Error notifications will be sent');
} else {
    console.log('⚠️  DEVELOPMENT MODE - Emails will NOT be sent');
    console.log('✅ Market data will still be stored for AI training');
    console.log('⚠️  Error notifications will NOT be sent');
    console.log('\n💡 To enable email alerts, set NODE_ENV=production in your .env file');
}

console.log('\n💾 Database Configuration:');
console.log(`📊 MongoDB URI: ${process.env.MONGO_URI || 'undefined (will use default)'}`);

console.log('\n🔗 API Endpoints for AI Training Data:');
console.log('📈 GET /api/ai-training/training-data - Get training data');
console.log('📈 GET /api/ai-training/training-data?format=csv - Get CSV format');
console.log('📈 GET /api/ai-training/stock-timeseries/:symbol - Get stock time series');
console.log('📈 GET /api/ai-training/market-volatility - Get market volatility');
console.log('📈 GET /api/ai-training/market-stats - Get market statistics');
console.log('📈 GET /api/ai-training/export/csv - Export as CSV');
console.log('📈 GET /api/ai-training/export/jsonl - Export as JSONL');

console.log('\n🚀 To start the server with production settings:');
console.log('1. Create/update .env file with NODE_ENV=production');
console.log('2. Set proper Gmail App Password (16 characters)');
console.log('3. Run: npm start');

console.log('\n=====================================');
console.log('Environment check complete! 🎉'); 
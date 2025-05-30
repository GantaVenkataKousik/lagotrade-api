const fs = require('fs');
const path = require('path');

console.log('🚀 LagoTrade Production Setup');
console.log('=============================');

const envContent = `# Environment Configuration
NODE_ENV=production

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=venkatakousikcse01@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
EMAIL_FROM=venkatakousikcse01@gmail.com

# Database Configuration
MONGO_URI=mongodb+srv://gvk:gvk123@gvk.orbwd1t.mongodb.net/trade

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
JWT_EXPIRE=1d
REFRESH_TOKEN_EXPIRE=7d

# Server Configuration
PORT=5000
API_BASE_URL=http://localhost:5000

# WhatsApp Configuration (Optional)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Broker API Configuration (Optional)
UPSTOX_CLIENT_ID=your_upstox_client_id
ZERODHA_API_KEY=your_zerodha_api_key
ANGEL_API_KEY=your_angel_api_key
`;

const envPath = path.join(__dirname, '.env');

try {
    if (fs.existsSync(envPath)) {
        console.log('⚠️  .env file already exists');
        console.log('📝 Current content will be backed up as .env.backup');

        // Backup existing file
        const backupPath = path.join(__dirname, '.env.backup');
        fs.copyFileSync(envPath, backupPath);
        console.log('✅ Backup created: .env.backup');
    }

    // Write new .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');

    console.log('\n📋 Next Steps:');
    console.log('1. Edit the .env file and replace placeholder values:');
    console.log('   - EMAIL_PASSWORD: Get Gmail App Password (16 characters)');
    console.log('   - JWT_SECRET: Generate a secure random string');
    console.log('   - REFRESH_TOKEN_SECRET: Generate another secure random string');

    console.log('\n🔐 To get Gmail App Password:');
    console.log('1. Go to Google Account settings');
    console.log('2. Enable 2-Factor Authentication');
    console.log('3. Go to Security > App passwords');
    console.log('4. Generate app password for "Mail"');
    console.log('5. Copy the 16-character password to EMAIL_PASSWORD');

    console.log('\n🚀 After setup, run:');
    console.log('   npm start');

    console.log('\n📊 Market Alert Features:');
    console.log('✅ Runs every 5 minutes during market hours (9 AM - 4 PM)');
    console.log('✅ Monitors NSE NIFTY 50 stocks');
    console.log('✅ Alerts for >0.5% gain or <-0.5% loss');
    console.log('✅ Stores data for AI training');
    console.log('✅ Sends emails to: koushikganta64@gmail.com, tradersaikishore007@gmail.com');

} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('\n📝 Manual Setup Required:');
    console.log('Create a .env file in the backend directory with the following content:');
    console.log('\n' + envContent);
}

console.log('\n=============================');
console.log('Setup complete! 🎉'); 
/**
 * Test script for NSE NIFTY 50 Market Alert System
 * Run with: node test-market-alert.js
 */

require('dotenv').config();
const { sendMarketAlert } = require('./services/market-alert.service');
const { sendEmail } = require('./utils/email.utils');

async function testEmailConfiguration() {
    console.log('🧪 Testing Email Configuration...\n');

    // Check environment variables
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.log('❌ Missing environment variables:');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        console.log('\n📝 Please set these in your .env file:');
        console.log('EMAIL_HOST=smtp.gmail.com');
        console.log('EMAIL_PORT=587');
        console.log('EMAIL_USER=your_gmail@gmail.com');
        console.log('EMAIL_PASSWORD=your_16_character_app_password');
        return false;
    }

    console.log('✅ All required environment variables are set');
    console.log(`📧 Email Host: ${process.env.EMAIL_HOST}`);
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`📧 Email Port: ${process.env.EMAIL_PORT}\n`);

    // Test sending a simple email
    try {
        console.log('📤 Sending test email...');
        const testEmailSent = await sendEmail({
            to: 'koushikganta64@gmail.com',
            subject: 'LagoTrade Market Alert - Test Email',
            text: 'This is a test email from LagoTrade Market Alert System.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #28a745;">✅ Test Email Successful!</h2>
                    <p>This is a test email from LagoTrade Market Alert System.</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')} IST</p>
                    <p>If you received this email, your email configuration is working correctly!</p>
                </div>
            `
        });

        if (testEmailSent) {
            console.log('✅ Test email sent successfully!');
            return true;
        } else {
            console.log('❌ Failed to send test email');
            return false;
        }
    } catch (error) {
        console.log('❌ Email test failed:', error.message);
        return false;
    }
}

async function testMarketAlert() {
    console.log('\n🧪 Testing Market Alert Functionality...\n');

    try {
        console.log('🔄 Running market alert test...');
        await sendMarketAlert();
        console.log('✅ Market alert test completed successfully!');
        return true;
    } catch (error) {
        console.log('❌ Market alert test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 LagoTrade Market Alert System Test\n');
    console.log('='.repeat(50));

    // Test 1: Email Configuration
    const emailTest = await testEmailConfiguration();

    if (!emailTest) {
        console.log('\n❌ Email configuration test failed. Please fix the issues above before proceeding.');
        return;
    }

    // Test 2: Market Alert
    const alertTest = await testMarketAlert();

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary:');
    console.log(`📧 Email Configuration: ${emailTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📈 Market Alert: ${alertTest ? '✅ PASS' : '❌ FAIL'}`);

    if (emailTest && alertTest) {
        console.log('\n🎉 All tests passed! Your market alert system is ready to run.');
        console.log('📧 Alerts will be sent to: koushikganta64@gmail.com');
        console.log('⏰ Cron schedule: Every 5 minutes during market hours (9:00 AM - 4:00 PM, Mon-Fri)');
        console.log('\n💡 To start the server with market alerts, run: npm start');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the configuration and try again.');
    }
}

// Run the tests
runTests().catch(console.error); 
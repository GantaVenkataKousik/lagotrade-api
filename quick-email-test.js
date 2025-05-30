/**
 * Quick Email Test for Gmail Configuration
 * Run with: node quick-email-test.js
 */

require('dotenv').config();
const { sendEmail } = require('./utils/email.utils');

async function testGmailSetup() {
    console.log('🧪 Testing Gmail Configuration...\n');

    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('❌ Missing email configuration!');
        console.log('📝 Please create a .env file with:');
        console.log('EMAIL_HOST=smtp.gmail.com');
        console.log('EMAIL_PORT=587');
        console.log('EMAIL_USER=your_gmail@gmail.com');
        console.log('EMAIL_PASSWORD=your_16_character_app_password');
        console.log('EMAIL_FROM=your_gmail@gmail.com');
        return;
    }

    console.log(`📧 Testing email from: ${process.env.EMAIL_USER}`);

    const testEmails = [
        'koushikganta64@gmail.com',
        'tradersaikishore007@gmail.com'
    ];

    for (const email of testEmails) {
        try {
            console.log(`📤 Sending test email to ${email}...`);

            const success = await sendEmail({
                to: email,
                subject: '✅ LagoTrade Email Test - Success!',
                text: `This is a test email from LagoTrade.\nTime: ${new Date().toLocaleString('en-IN')} IST\nIf you receive this, your email setup is working!`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #28a745; border-radius: 10px; max-width: 500px;">
                        <h2 style="color: #28a745; text-align: center;">✅ Email Test Successful!</h2>
                        <p><strong>From:</strong> LagoTrade Market Alert System</p>
                        <p><strong>To:</strong> ${email}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN')} IST</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p style="margin: 0;"><strong>✅ If you receive this email, your Gmail configuration is working correctly!</strong></p>
                        </div>
                        <p style="color: #666; font-size: 12px;">Next step: The market alerts will be sent to this email address every 5 minutes during market hours.</p>
                    </div>
                `
            });

            if (success) {
                console.log(`✅ Test email sent successfully to ${email}`);
            } else {
                console.log(`❌ Failed to send test email to ${email}`);
            }

        } catch (error) {
            console.log(`❌ Error sending to ${email}:`, error.message);
        }
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Check your email inbox for the test emails');
    console.log('2. If received, run: npm start (to start the market alert system)');
    console.log('3. Market alerts will be sent every 5 minutes during market hours');
}

testGmailSetup().catch(console.error); 
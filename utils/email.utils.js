/**
 * Email utilities for LagoTrade API
 */

const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version of email
 * @param {string} options.html - HTML version of email
 * @returns {Promise<boolean>} - Success status
 */
exports.sendEmail = async (options) => {
    try {
        // Create a transporter based on environment
        let transporter;

        if (process.env.NODE_ENV === 'production') {
            // Production transporter using actual SMTP settings
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
        } else {
            // Development/testing transporter using Ethereal
            // Create a test account on the fly if not provided in env vars
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                const testAccount = await nodemailer.createTestAccount();
                process.env.EMAIL_USER = testAccount.user;
                process.env.EMAIL_PASSWORD = testAccount.pass;

                transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
            } else {
                transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
                    port: process.env.EMAIL_PORT || 587,
                    secure: process.env.EMAIL_PORT === '465',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
            }
        }

        // Email options
        const mailOptions = {
            from: `"LagoTrade" <${process.env.EMAIL_FROM || 'noreply@lagotrade.com'}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        // Log URL for preview in development (Ethereal)
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }

        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

/**
 * Generate email template for OTP
 * @param {string} otp - The OTP code
 * @param {string} type - The type of OTP (verification, reset, etc.)
 * @returns {Object} - Email template with text and HTML versions
 */
exports.generateOTPEmail = (otp, type = 'verification') => {
    let subject, title, message;

    switch (type) {
        case 'reset':
            subject = 'LagoTrade - Password Reset';
            title = 'Password Reset';
            message = 'Your password reset code is:';
            break;
        case 'verification':
        default:
            subject = 'LagoTrade - Email Verification';
            title = 'Email Verification';
            message = 'Your verification code is:';
            break;
    }

    const text = `${message} ${otp}. This code will expire in 10 minutes.`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #333;">${title}</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="font-size: 16px; color: #555;">${message}</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f1f1f1; border-radius: 4px;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #777;">This code will expire in 10 minutes.</p>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9e9e9; text-align: center; font-size: 12px; color: #999;">
                <p>If you didn't request this code, please ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} LagoTrade. All rights reserved.</p>
            </div>
        </div>
    `;

    return { subject, text, html };
}; 
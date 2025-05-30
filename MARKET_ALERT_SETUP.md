# NSE NIFTY 50 Market Alert Setup Guide

## 🚀 Quick Setup

### 1. Gmail App Password Setup

**IMPORTANT:** You cannot use your regular Gmail password (`Bhavani1201@`). You need to create an App Password.

#### Steps to get Gmail App Password:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication** (if not already enabled)
3. Go to **App passwords** section
4. Select **Mail** as the app
5. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)

### 2. Create Environment File

Create a `.env` file in the `backend` directory with:

```env
# Gmail Configuration for Market Alerts
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_actual_gmail@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
EMAIL_FROM=your_actual_gmail@gmail.com

# JWT Secrets (generate random strings)
JWT_SECRET=your_super_secret_jwt_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here

# Google OAuth (already configured)
GOOGLE_CLIENT_ID=1085393170023-9f13eked9qd9k16im6p10tcu61u62c7h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Environment
NODE_ENV=development
PORT=3000
```

### 3. Test the Setup

Run the test script to verify everything works:

```bash
node test-market-alert.js
```

This will:
- ✅ Check email configuration
- ✅ Send a test email to `koushikganta64@gmail.com`
- ✅ Test the NSE NIFTY 50 API integration

### 4. Start the Server

```bash
npm start
```

## 📊 How It Works

### Market Alert Features:
- **Data Source:** NSE NIFTY 50 API (`https://www.nseindia.com/api/market-data-pre-open?key=NIFTY`)
- **Alert Criteria:** 
  - 🚀 **Gainers:** Stocks with >1.0% increase
  - 📉 **Losers:** Stocks with <-1.0% decrease
- **Email Recipient:** `koushikganta64@gmail.com`

### Schedule:
- ⏰ **Every 5 minutes** during market hours (9:00 AM - 4:00 PM, Mon-Fri)
- 🌅 **Special alert** at 9:00 AM (pre-market)
- 🌆 **Special alert** at 4:00 PM (post-market)

### Sample Email Alert:
```
Subject: NSE NIFTY 50 Alert - 3 Gainers, 2 Losers

🚀 Top Gainers (above +1.0%)
RELIANCE: +2.3% (₹2,450) Change: ₹55
TCS: +1.8% (₹3,200) Change: ₹56

📉 Top Losers (below -1.0%)
HDFC: -2.1% (₹1,580) Change: ₹-34
```

## 🔧 Troubleshooting

### Common Issues:

1. **Email not sending:**
   - Verify Gmail App Password (not regular password)
   - Check 2-Factor Authentication is enabled
   - Ensure `.env` file has correct email settings

2. **NSE API errors:**
   - API might be temporarily down
   - Check internet connection
   - Error emails will be sent to notify you

3. **Cron jobs not running:**
   - Server must be running continuously
   - Check server logs for cron execution messages

### Test Commands:

```bash
# Test email configuration only
node -e "require('./utils/email.utils').sendEmail({to:'koushikganta64@gmail.com',subject:'Test',text:'Test email'})"

# Test market alert manually
node -e "require('./services/market-alert.service').sendMarketAlert()"

# Full test suite
node test-market-alert.js
```

## 📱 Monitoring

The system will log:
- 🕐 When alerts are triggered
- 📊 Number of stocks found
- 📈 Number of gainers/losers
- ✅ Email send status
- ❌ Any errors encountered

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use App Passwords, not regular Gmail passwords
- Keep your environment variables secure
- Monitor email usage to avoid rate limits

## 🎯 Next Steps

1. **Test the system** with the test script
2. **Start the server** and monitor logs
3. **Check your email** for alerts during market hours
4. **Customize thresholds** if needed (currently set to ±1.0%)

---

**Email Target:** koushikganta64@gmail.com  
**Market Hours:** 9:00 AM - 4:00 PM IST, Monday-Friday  
**Alert Frequency:** Every 5 minutes during market hours 
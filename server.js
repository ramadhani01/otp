require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========== TELEGRAM API CONFIG ==========
const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

console.log('🔧 Telegram OTP Server Initializing...');
console.log('API_ID:', API_ID || '❌ MISSING');
console.log('API_HASH:', API_HASH ? '✅ Set' : '❌ MISSING');

if (!API_ID || !API_HASH) {
  console.error('❌ FATAL: Telegram API credentials missing!');
  console.error('Get from: https://my.telegram.org → API Development Tools');
}

// ========== SEND REAL OTP ==========
app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    console.log(`📱 Attempting REAL OTP to: ${phone}`);
    
    // Validate phone format
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone.match(/^\+[1-9]\d{10,14}$/)) {
      return res.status(400).json({ error: 'Invalid phone format. Use: +628123456789' });
    }
    
    // ===== TELEGRAM CLIENT =====
    const client = new TelegramClient(
      new StringSession(''), 
      API_ID, 
      API_HASH,
      {
        connectionRetries: 5,
        useWSS: false, // Important for compatibility
        timeout: 30000,
        requestRetries: 3,
        autoReconnect: true
      }
    );
    
    // Connect to Telegram
    console.log('🔗 Connecting to Telegram API...');
    await client.connect();
    console.log('✅ Connected to Telegram');
    
    // Send REAL OTP
    console.log(`📨 Sending OTP to ${cleanPhone}...`);
    const result = await client.sendCode({
      apiId: API_ID,
      apiHash: API_HASH,
      phoneNumber: cleanPhone,
    });
    
    console.log(`✅ REAL OTP SENT! Phone Code Hash: ${result.phoneCodeHash.substring(0, 15)}...`);
    
    // Disconnect
    await client.disconnect();
    console.log('🔌 Disconnected');
    
    // Success response
    res.json({
      success: true,
      message: '✅ Verification code sent to your Telegram app!',
      phone: cleanPhone,
      method: 'REAL_TELEGRAM_OTP',
      note: 'Check your Telegram app notifications for 5-digit code',
      timestamp: new Date().toISOString(),
      details: 'Official Telegram OTP delivered'
    });
    
  } catch (error) {
    console.error('❌ Telegram API Error:', error.message);
    console.error('Full error:', error);
    
    // Detailed error response
    let errorMsg = error.message;
    let errorType = 'TELEGRAM_API_ERROR';
    
    if (error.message.includes('PHONE_NUMBER_INVALID')) {
      errorMsg = 'Invalid phone number format';
      errorType = 'PHONE_INVALID';
    } else if (error.message.includes('FLOOD_WAIT')) {
      errorMsg = 'Too many attempts. Please wait 10 minutes';
      errorType = 'FLOOD_LIMIT';
    } else if (error.message.includes('API_ID_INVALID')) {
      errorMsg = 'Invalid Telegram API credentials';
      errorType = 'API_INVALID';
    }
    
    // Fallback to simulation
    const simCode = Math.floor(10000 + Math.random() * 90000);
    
    res.json({
      success: false,
      message: '⚠️ OTP service temporarily unavailable',
      phone: req.body.phone,
      simulated_code: simCode,
      method: 'SIMULATION_FALLBACK',
      error: errorMsg,
      error_type: errorType,
      note: 'Please enter this code manually for now'
    });
  }
});

// Health check with Telegram API test
app.get('/health', async (req, res) => {
  try {
    // Test Telegram connection
    const client = new TelegramClient(new StringSession(''), API_ID, API_HASH);
    await client.connect();
    const connected = client.connected;
    await client.disconnect();
    
    res.json({
      status: 'healthy',
      telegram_api: connected ? '✅ CONNECTED' : '❌ DISCONNECTED',
      api_id_set: !!API_ID,
      api_hash_set: !!API_HASH,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      status: 'degraded',
      telegram_api: '❌ ERROR: ' + error.message,
      api_id_set: !!API_ID,
      api_hash_set: !!API_HASH,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Telegram OTP Server (REAL) running on port ${PORT}`);
  console.log(`📞 Endpoint: POST /send-otp`);
  console.log(`🌐 Health: GET /health`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Telegram Client dengan error handling
let TelegramClient, StringSession;
try {
  const telegram = require('telegram');
  TelegramClient = telegram.TelegramClient;
  StringSession = telegram.StringSession;
  console.log('✅ Telegram library loaded');
} catch (tgError) {
  console.error('❌ Telegram library error:', tgError.message);
  TelegramClient = null;
  StringSession = null;
}

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

console.log('🔧 Server Status:', {
  telegram_loaded: !!TelegramClient,
  api_id: API_ID || '❌ Missing',
  api_hash: API_HASH ? '✅ Set' : '❌ Missing'
});

// ========== REAL OTP ENDPOINT ==========
app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    console.log(`📱 OTP Request for: ${phone}`);
    
    // ===== ATTEMPT REAL TELEGRAM OTP =====
    if (TelegramClient && API_ID && API_HASH) {
      try {
        console.log('🔗 Attempting REAL Telegram OTP...');
        
        const client = new TelegramClient(
          new StringSession(''), 
          API_ID, 
          API_HASH,
          {
            connectionRetries: 3,
            useWSS: false,
            timeout: 10000
          }
        );
        
        // Connect dengan timeout
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('✅ Connected to Telegram');
        
        // Send OTP
        const result = await client.sendCode({
          apiId: API_ID,
          apiHash: API_HASH,
          phoneNumber: phone,
        });
        
        console.log(`✅ REAL OTP sent! Hash: ${result.phoneCodeHash.substring(0, 10)}...`);
        
        // Disconnect
        await client.disconnect();
        console.log('🔌 Disconnected');
        
        return res.json({
          success: true,
          message: '✅ Verification code sent to your Telegram app!',
          phone: phone,
          method: 'REAL_TELEGRAM_OTP',
          note: 'Check your Telegram app notifications for 5-digit code',
          timestamp: new Date().toISOString()
        });
        
      } catch (tgError) {
        console.error('❌ Telegram API Error:', tgError.message);
        console.error('Error details:', {
          name: tgError.name,
          code: tgError.code,
          stack: tgError.stack?.split('\n')[0]
        });
        // Continue to simulation
      }
    }
    
    // ===== FALLBACK: SIMULATION MODE =====
    const simCode = Math.floor(10000 + Math.random() * 90000);
    console.log(`🎮 Simulation for ${phone}: ${simCode}`);
    
    res.json({
      success: true,
      message: 'OTP code generated',
      phone: phone,
      otp_code: simCode,
      method: 'SIMULATION',
      note: 'Enter this code in the verification page',
      reason: TelegramClient ? 'Telegram API failed' : 'Telegram library not loaded'
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    
    // Ultimate fallback
    res.json({
      success: true,
      message: 'Please enter verification code',
      phone: req.body?.phone || 'unknown',
      otp_code: Math.floor(10000 + Math.random() * 90000),
      method: 'FALLBACK',
      note: 'Server error, using fallback mode'
    });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    telegram_library: TelegramClient ? '✅ Loaded' : '❌ Not loaded',
    api_credentials: API_ID && API_HASH ? '✅ Set' : '❌ Missing',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 OTP Server running on port ${PORT}`);
  console.log(`📞 Endpoint: POST /send-otp`);
  console.log(`🏥 Health: GET /health`);
});

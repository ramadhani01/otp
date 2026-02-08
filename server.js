require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware untuk log semua request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`, req.body);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OTP Server Running',
    endpoints: {
      send_otp: 'POST /send-otp',
      health: 'GET /health'
    },
    time: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }
    
    console.log(`📱 Processing OTP request for: ${phone}`);
    
    // ========== TELEGRAM OTP REAL ==========
    // Coba pakai Telegram API jika credentials ada
    if (process.env.API_ID && process.env.API_HASH) {
      try {
        const { TelegramClient } = require('telegram');
        const { StringSession } = require('telegram/sessions');
        
        const client = new TelegramClient(
          new StringSession(''), 
          parseInt(process.env.API_ID), 
          process.env.API_HASH
        );
        
        await client.connect();
        const result = await client.sendCode({
          apiId: parseInt(process.env.API_ID),
          apiHash: process.env.API_HASH,
          phoneNumber: phone,
        });
        
        await client.disconnect();
        
        console.log(`✅ Real OTP sent to ${phone}`);
        
        return res.json({
          success: true,
          message: 'OTP sent successfully to your Telegram app',
          phone: phone,
          method: 'real_telegram_api',
          note: 'Check your Telegram app for 5-digit code'
        });
        
      } catch (tgError) {
        console.log('⚠️ Telegram API failed, using simulation:', tgError.message);
        // Lanjut ke simulation mode
      }
    }
    
    // ========== SIMULATION MODE ==========
    const simulatedCode = Math.floor(10000 + Math.random() * 90000);
    
    console.log(`🎮 Simulation mode for ${phone}, code: ${simulatedCode}`);
    
    res.json({
      success: true,
      message: 'OTP simulation successful',
      phone: phone,
      simulated_code: simulatedCode,
      method: 'simulation',
      note: 'Real OTP requires valid Telegram API credentials'
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint
app.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    body: req.body,
    env: {
      api_id_set: !!process.env.API_ID,
      api_hash_set: !!process.env.API_HASH
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 OTP Server started on port ${PORT}`);
  console.log(`🔧 API_ID: ${process.env.API_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`🔧 API_HASH: ${process.env.API_HASH ? '✅ Set' : '❌ Missing'}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const app = express();
app.use(cors());
app.use(express.json());

// Config
const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

console.log('🔧 Config Check:', {
  API_ID: API_ID || '❌ MISSING',
  API_HASH: API_HASH ? '✅ Set' : '❌ MISSING'
});

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  
  // ================== REAL OTP ==================
  if (API_ID && API_HASH) {
    try {
      console.log(`📱 Attempting REAL OTP to: ${phone}`);
      
      const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
        connectionRetries: 5,
      });
      
      await client.connect();
      
      // KIRIM OTP ASLI DARI TELEGRAM
      const result = await client.sendCode({
        apiId: API_ID,
        apiHash: API_HASH,
        phoneNumber: phone,
      });
      
      console.log(`✅ REAL OTP sent! Hash: ${result.phoneCodeHash}`);
      
      await client.disconnect();
      
      return res.json({
        success: true,
        message: '✅ REAL OTP sent to your Telegram app!',
        phone: phone,
        method: 'REAL_TELEGRAM_API',
        note: 'Check your Telegram app notifications'
      });
      
    } catch (error) {
      console.error('❌ Telegram API Error:', error.message);
      
      // Fallback ke simulation
      const simCode = Math.floor(10000 + Math.random() * 90000);
      return res.json({
        success: true,
        message: 'OTP simulation (API failed)',
        phone: phone,
        simulated_code: simCode,
        method: 'SIMULATION_FALLBACK',
        error: error.message
      });
    }
  }
  
  // ================== SIMULATION ==================
  const simCode = Math.floor(10000 + Math.random() * 90000);
  console.log(`🎮 Simulation for ${phone}: ${simCode}`);
  
  res.json({
    success: true,
    message: 'OTP simulation mode',
    phone: phone,
    simulated_code: simCode,
    method: 'SIMULATION',
    note: 'Set API_ID & API_HASH for real OTP'
  });
});

app.listen(3000, () => {
  console.log('✅ OTP Server ready on port 3000');
});

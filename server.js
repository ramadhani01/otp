require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

console.log('🚀 Starting OTP Server...');

app.get('/', (req, res) => {
  res.json({ status: 'OTP Server running', time: new Date().toISOString() });
});

app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    console.log(`📱 Sending OTP to: ${phone}`);
    
    const client = new TelegramClient(new StringSession(''), API_ID, API_HASH);
    await client.connect();
    
    const result = await client.sendCode({
      apiId: API_ID,
      apiHash: API_HASH,
      phoneNumber: phone,
    });
    
    console.log('✅ OTP sent!');
    
    res.json({
      success: true,
      message: 'OTP sent to Telegram app',
      phoneCodeHash: result.phoneCodeHash
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// SERVER OTP ASLI - Upload ke Railway.app
require('dotenv').config();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// DAPATKAN DARI my.telegram.org
const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

// Simpan session sementara
const activeSessions = new Map();

// Endpoint untuk kirim OTP asli
app.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nomor telepon diperlukan' 
      });
    }
    
    console.log(`📞 Mengirim OTP ke: ${phone}`);
    
    // Buat client Telegram baru
    const stringSession = new StringSession('');
    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
      connectionRetries: 5,
      useWSS: false,
    });
    
    // Connect ke Telegram
    await client.connect();
    console.log(`✅ Connected untuk ${phone}`);
    
    // Kirim kode OTP asli
    const result = await client.sendCode({
      apiId: API_ID,
      apiHash: API_HASH,
      phoneNumber: phone,
    });
    
    console.log(`📱 OTP terkirim untuk ${phone}, hash: ${result.phoneCodeHash}`);
    
    // Simpan session untuk verifikasi nanti
    activeSessions.set(phone, {
      phoneCodeHash: result.phoneCodeHash,
      session: stringSession.save(),
      timestamp: Date.now()
    });
    
    // Hapus session lama setelah 10 menit
    setTimeout(() => {
      if (activeSessions.has(phone)) {
        activeSessions.delete(phone);
        console.log(`🗑️ Session expired untuk ${phone}`);
      }
    }, 10 * 60 * 1000);
    
    res.json({
      success: true,
      message: 'OTP berhasil dikirim ke aplikasi Telegram',
      phoneCodeHash: result.phoneCodeHash,
      timeout: 120 // detik
    });
    
  } catch (error) {
    console.error('❌ Error mengirim OTP:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Pastikan API_ID dan API_HASH valid'
    });
  }
});

// Endpoint untuk verifikasi OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !

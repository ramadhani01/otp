const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Log semua request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, req.body);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OTP Server ONLINE',
    endpoints: {
      send_otp: 'POST /send-otp - Send OTP code',
      health: 'GET /health - Server health check'
    },
    time: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Send OTP endpoint (SIMULATION MODE)
app.post('/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    console.log(`📱 OTP Request for: ${phone}`);
    
    // Generate random OTP
    const otpCode = Math.floor(10000 + Math.random() * 90000);
    
    // Log untuk debugging
    console.log(`🎮 Generated OTP for ${phone}: ${otpCode}`);
    
    // Response
    res.json({
      success: true,
      message: 'OTP code generated successfully',
      phone: phone,
      otp_code: otpCode,
      note: 'Simulation mode - User must enter this code manually',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /send-otp:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test endpoint
app.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    received: req.body
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ OTP Server running on port ${PORT}`);
  console.log(`🌐 Server is ready to accept requests`);
});

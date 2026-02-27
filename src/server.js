require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set true behind HTTPS in prod
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// Catch-all for frontend routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found.' });
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    const demoMode = process.env.DEMO_MODE === 'true';
    console.log(`\n🚀 Admin Panel running on port ${PORT}`);
    console.log(`🔒 Super Admin ID: ${process.env.SUPER_ADMIN_TG_ID || '(not set)'}`);
    console.log(`📡 Telegram Bot: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not set'}`);
    console.log(`🧪 Demo Mode: ${demoMode ? '✅ ON (OTP shown in API response)' : '❌ OFF'}`);
    console.log(`\n🌐 Open: http://localhost:${PORT}\n`);
});

module.exports = app;

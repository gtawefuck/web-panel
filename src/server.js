require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/pay', require('./routes/pay'));

// Per-user Flipkart shop pages — /shop/:slug
app.get('/shop/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'shop.html'));
});

// Root & catch-all
app.get('/', (req, res) => res.redirect('/login.html'));

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
    console.log(`🧪 Demo Mode: ${demoMode ? '✅ ON' : '❌ OFF'}`);
    console.log(`\n🌐 Open: http://localhost:${PORT}\n`);
});

module.exports = app;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateOTP, verifyOTP } = require('../otp');
const { sendOTP } = require('../telegram');

const SUPER_ADMIN_TG_ID = process.env.SUPER_ADMIN_TG_ID || '';

/**
 * Resolve role for a given Telegram ID
 */
function resolveRole(tgId) {
    if (tgId === SUPER_ADMIN_TG_ID) return { role: 'superAdmin', allowed: true };

    const admin = db.prepare('SELECT * FROM admins WHERE tg_id = ?').get(tgId);
    if (admin) return { role: 'admin', allowed: true };

    const user = db.prepare('SELECT * FROM users WHERE tg_id = ?').get(tgId);
    if (!user) return { role: null, allowed: false, reason: 'not_found' };

    const now = new Date();
    const expiry = new Date(user.expires_at);
    if (expiry < now) return { role: null, allowed: false, reason: 'expired', expiredAt: user.expires_at };

    return { role: 'user', allowed: true, user };
}

// POST /api/auth/request-otp
router.post('/request-otp', async (req, res) => {
    try {
        const { tgId } = req.body;
        if (!tgId || !/^\d+$/.test(String(tgId).trim())) {
            return res.status(400).json({ error: 'Invalid Telegram User ID.' });
        }

        const cleanId = String(tgId).trim();

        // Pre-check access before sending OTP
        const roleCheck = resolveRole(cleanId);
        if (!roleCheck.allowed) {
            if (roleCheck.reason === 'not_found') {
                return res.status(403).json({ error: 'Access not granted. Please purchase access.' });
            }
            if (roleCheck.reason === 'expired') {
                return res.status(403).json({ error: 'Your access has expired. Please contact an admin.' });
            }
        }

        const otp = generateOTP(cleanId);
        const result = await sendOTP(cleanId, otp);

        const responseData = { success: true, message: 'OTP sent to your Telegram.' };
        // In demo mode, return OTP in response for testing
        if (result.demo) {
            responseData.demo = true;
            responseData.demoOtp = result.demoOtp;
            responseData.message = 'DEMO MODE: OTP sent (shown below since no bot configured).';
        }

        res.json(responseData);
    } catch (err) {
        console.error('OTP send error:', err.message);
        if (err.message && err.message.includes('chat not found')) {
            return res.status(400).json({ error: 'Could not reach your Telegram. Make sure you have started the bot first (/start).' });
        }
        res.status(500).json({ error: 'Failed to send OTP. Check bot configuration.' });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
    const { tgId, otp } = req.body;
    if (!tgId || !otp) {
        return res.status(400).json({ error: 'Telegram ID and OTP are required.' });
    }

    const cleanId = String(tgId).trim();
    const result = verifyOTP(cleanId, otp);

    if (!result.valid) {
        const messages = {
            no_otp: 'No OTP requested. Please request an OTP first.',
            expired: 'OTP has expired. Please request a new one.',
            wrong_otp: 'Invalid OTP. Please try again.'
        };
        return res.status(400).json({ error: messages[result.reason] || 'Invalid OTP.' });
    }

    const roleCheck = resolveRole(cleanId);
    if (!roleCheck.allowed) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    req.session.user = {
        tgId: cleanId,
        role: roleCheck.role,
        loginAt: new Date().toISOString()
    };

    // Log login
    db.prepare(`INSERT INTO login_logs (tg_id, action, role, details) VALUES (?, ?, ?, ?)`)
        .run(cleanId, 'login', roleCheck.role, `Logged in via OTP`);

    const payload = { success: true, role: roleCheck.role };
    if (roleCheck.role === 'user' && roleCheck.user) {
        payload.expiresAt = roleCheck.user.expires_at;
    }
    res.json(payload);
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    res.json({ user: req.session.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    const tgId = req.session?.user?.tgId;
    req.session.destroy(() => {
        if (tgId) {
            db.prepare(`INSERT INTO login_logs (tg_id, action) VALUES (?, ?)`)
                .run(tgId, 'logout');
        }
        res.json({ success: true });
    });
});

module.exports = router;

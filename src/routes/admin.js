const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin, requireSuperAdmin } = require('../middleware/auth');

function logAction(tgId, action, role, details = '') {
    db.prepare(`INSERT INTO login_logs (tg_id, action, role, details) VALUES (?, ?, ?, ?)`)
        .run(tgId, action, role, details);
}

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', requireAdmin, (req, res) => {
    const users = db.prepare('SELECT * FROM users ORDER BY activated_at DESC').all();
    const now = new Date();
    const enriched = users.map(u => ({
        ...u,
        status: new Date(u.expires_at) < now ? 'expired' : 'active'
    }));
    res.json({ users: enriched });
});

// POST /api/admin/users
router.post('/users', requireAdmin, (req, res) => {
    const { tgId, username, days } = req.body;
    if (!tgId || !days || isNaN(days) || days < 1) {
        return res.status(400).json({ error: 'tgId and valid days (≥ 1) are required.' });
    }

    const cleanId = String(tgId).trim();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(days));

    try {
        db.prepare(`
      INSERT INTO users (tg_id, username, added_by, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(cleanId, username || '', req.session.user.tgId, expiresAt.toISOString());

        logAction(req.session.user.tgId, 'add_user', req.session.user.role,
            `Added user ${cleanId} (${username}) for ${days} days`);

        res.json({ success: true, message: `User ${cleanId} added with ${days} day(s) access.`, expiresAt });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'User already exists. Use extend to update their access.' });
        }
        throw err;
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    logAction(req.session.user.tgId, 'remove_user', req.session.user.role, `Removed user ${user.tg_id}`);
    res.json({ success: true, message: `User ${user.tg_id} removed.` });
});

// PATCH /api/admin/users/:id/extend
router.patch('/users/:id/extend', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { days } = req.body;
    if (!days || isNaN(days) || days < 1) {
        return res.status(400).json({ error: 'Valid days (≥ 1) required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Extend from now if expired, otherwise from current expiry
    const base = new Date(user.expires_at) < new Date() ? new Date() : new Date(user.expires_at);
    base.setDate(base.getDate() + parseInt(days));

    db.prepare('UPDATE users SET expires_at = ? WHERE id = ?').run(base.toISOString(), id);
    logAction(req.session.user.tgId, 'extend_user', req.session.user.role,
        `Extended user ${user.tg_id} by ${days} day(s), new expiry: ${base.toISOString()}`);

    res.json({ success: true, newExpiresAt: base.toISOString() });
});

// ─── ADMINS (Super Admin only) ─────────────────────────────────────────────

// GET /api/admin/admins
router.get('/admins', requireSuperAdmin, (req, res) => {
    const admins = db.prepare('SELECT * FROM admins ORDER BY added_at DESC').all();
    res.json({ admins });
});

// POST /api/admin/admins
router.post('/admins', requireSuperAdmin, (req, res) => {
    const { tgId } = req.body;
    if (!tgId) return res.status(400).json({ error: 'tgId is required.' });

    const cleanId = String(tgId).trim();
    if (cleanId === process.env.SUPER_ADMIN_TG_ID) {
        return res.status(400).json({ error: 'Super Admin cannot be added as a regular admin.' });
    }

    try {
        db.prepare(`
      INSERT INTO admins (tg_id, added_by) VALUES (?, ?)
    `).run(cleanId, req.session.user.tgId);

        logAction(req.session.user.tgId, 'add_admin', 'superAdmin', `Added admin ${cleanId}`);
        res.json({ success: true, message: `Admin ${cleanId} added.` });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'This Telegram ID is already an admin.' });
        }
        throw err;
    }
});

// DELETE /api/admin/admins/:id
router.delete('/admins/:id', requireSuperAdmin, (req, res) => {
    const { id } = req.params;
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });

    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    logAction(req.session.user.tgId, 'remove_admin', 'superAdmin', `Removed admin ${admin.tg_id}`);
    res.json({ success: true });
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/logs
router.get('/logs', requireAdmin, (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const logs = db.prepare(
        'SELECT * FROM login_logs ORDER BY timestamp DESC LIMIT ?'
    ).all(limit);
    res.json({ logs });
});

module.exports = router;

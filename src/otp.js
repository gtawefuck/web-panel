const crypto = require('crypto');
const db = require('./db');

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a 6-digit OTP and store it in DB
 */
function generateOTP(tgId) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    db.prepare(`
    INSERT OR REPLACE INTO otp_store (tg_id, otp, expires_at)
    VALUES (?, ?, ?)
  `).run(tgId, otp, expiresAt);

    return otp;
}

/**
 * Verify OTP — returns true and deletes on success, false otherwise
 */
function verifyOTP(tgId, inputOtp) {
    const row = db.prepare('SELECT * FROM otp_store WHERE tg_id = ?').get(tgId);

    if (!row) return { valid: false, reason: 'no_otp' };
    if (Date.now() > row.expires_at) {
        db.prepare('DELETE FROM otp_store WHERE tg_id = ?').run(tgId);
        return { valid: false, reason: 'expired' };
    }
    if (row.otp !== String(inputOtp).trim()) {
        return { valid: false, reason: 'wrong_otp' };
    }

    // Delete OTP immediately after use
    db.prepare('DELETE FROM otp_store WHERE tg_id = ?').run(tgId);
    return { valid: true };
}

module.exports = { generateOTP, verifyOTP };

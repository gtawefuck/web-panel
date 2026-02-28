const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const crypto = require('crypto');
const QRCode = require('qrcode');

// GET /api/pay/qr — generate QR code PNG data URL for a UPI URI
router.get('/qr', async (req, res) => {
    const { upi_uri } = req.query;
    if (!upi_uri) return res.status(400).json({ error: 'upi_uri required' });
    try {
        const dataUrl = await QRCode.toDataURL(upi_uri, {
            width: 300, margin: 2,
            color: { dark: '#1a237e', light: '#ffffff' }
        });
        res.json({ qr: dataUrl });
    } catch (e) {
        res.status(500).json({ error: 'Failed to generate QR' });
    }
});


// ── Helpers ───────────────────────────────────────────────────────────────────
function generateTxnRef() {
    return 'TXN' + Date.now() + crypto.randomBytes(3).toString('hex').toUpperCase();
}
function buildUpiUri({ upiId, merchantName, amount, txnRef, note }) {
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName || 'FlipDeals')}&am=${amount}&tn=${encodeURIComponent(note || 'Online Order')}&tr=${txnRef}&cu=INR`;
}
function ensureTxnCols() {
    try { db.exec(`ALTER TABLE transactions ADD COLUMN notes TEXT`); } catch { }
}

// POST /api/pay/initiate — create transaction, return UPI URI + txn_ref
router.post('/initiate', (req, res) => {
    const { slug, amount, customer_name, customer_email, customer_phone, delivery_address, cart_items } = req.body;
    if (!slug || !amount) return res.status(400).json({ error: 'slug and amount required' });

    const shop = db.prepare('SELECT * FROM shops WHERE slug = ?').get(slug);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    if (!shop.upi_id) return res.status(400).json({ error: 'Shop has no UPI ID set. Contact the shop owner.' });

    // Migrate if needed
    try { db.exec(`ALTER TABLE shops ADD COLUMN merchant_name TEXT DEFAULT ''`); } catch { }

    const txnRef = generateTxnRef();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry
    const upiUri = buildUpiUri({
        upiId: shop.upi_id,
        merchantName: shop.merchant_name || shop.shop_name,
        amount,
        txnRef,
        note: `Order from ${shop.shop_name}`
    });

    db.prepare(`
        INSERT INTO transactions (shop_slug, txn_ref, amount, merchant_upi, customer_name, customer_email,
        customer_phone, delivery_address, cart_items, status, expires_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(slug, txnRef, amount, shop.upi_id, customer_name || '', customer_email || '',
        customer_phone || '', delivery_address || '', JSON.stringify(cart_items || []), 'pending', expiresAt);

    res.json({
        success: true,
        txnRef,
        expiresAt,
        upiUri,
        upiId: shop.upi_id,
        merchantName: shop.merchant_name || shop.shop_name,
        amount,
        paymentQr: shop.payment_qr || null
    });
});

// POST /api/pay/confirm — customer submits UTR after paying
router.post('/confirm', (req, res) => {
    const { txnRef, utr } = req.body;
    if (!txnRef || !utr) return res.status(400).json({ error: 'txnRef and utr required' });

    const txn = db.prepare('SELECT * FROM transactions WHERE txn_ref = ?').get(txnRef);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status === 'verified') return res.json({ success: true, status: 'verified', message: 'Payment already verified!' });
    if (txn.status === 'failed') return res.status(400).json({ error: 'This transaction was marked as failed.' });

    // Validate UTR format (12 digits for IMPS/UPI, or alphanumeric)
    const utrClean = utr.trim().toUpperCase();
    if (utrClean.length < 6) return res.status(400).json({ error: 'Invalid UTR/Transaction ID format.' });

    // Check expiry
    if (new Date(txn.expires_at) < new Date()) {
        db.prepare(`UPDATE transactions SET status = 'expired' WHERE txn_ref = ?`).run(txnRef);
        return res.status(400).json({ error: 'Payment link has expired. Please try again.' });
    }

    db.prepare(`UPDATE transactions SET utr = ?, status = 'utr_submitted', notes = ? WHERE txn_ref = ?`)
        .run(utrClean, 'UTR submitted at ' + new Date().toISOString(), txnRef);

    res.json({
        success: true,
        status: 'utr_submitted',
        message: 'Payment details submitted! Admin will verify shortly.',
        txnRef
    });
});

// GET /api/pay/status/:txnRef — check transaction status (public)
router.get('/status/:txnRef', (req, res) => {
    const txn = db.prepare('SELECT txn_ref, amount, status, created_at, verified_at FROM transactions WHERE txn_ref = ?').get(req.params.txnRef);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ txn });
});

// GET /api/pay/transactions — admin: get all transactions for their shop
router.get('/transactions', requireAuth, (req, res) => {
    const { tgId, role } = req.session.user;
    let txns;
    if (role === 'superAdmin') {
        txns = db.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 300').all();
    } else {
        const shop = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(tgId);
        if (!shop) return res.status(404).json({ error: 'No shop found.' });
        txns = db.prepare('SELECT * FROM transactions WHERE shop_slug = ? ORDER BY created_at DESC LIMIT 200').all(shop.slug);
    }
    res.json({ transactions: txns.map(t => ({ ...t, cart_items: safeJson(t.cart_items) })) });
});

// PATCH /api/pay/transactions/:id — admin: verify or reject payment
router.patch('/transactions/:id', requireAuth, (req, res) => {
    const { status, notes } = req.body; // status: 'verified' | 'failed'
    if (!['verified', 'failed'].includes(status)) return res.status(400).json({ error: 'status must be verified or failed' });

    const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found.' });

    // Check ownership (admin can only manage their shop, superAdmin can manage all)
    if (req.session.user.role !== 'superAdmin') {
        const shop = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(req.session.user.tgId);
        if (!shop || shop.slug !== txn.shop_slug) return res.status(403).json({ error: 'Access denied.' });
    }

    db.prepare(`UPDATE transactions SET status = ?, notes = ?, verified_at = ? WHERE id = ?`)
        .run(status, notes || (status === 'verified' ? 'Manually verified by admin' : 'Rejected by admin'), new Date().toISOString(), req.params.id);

    res.json({ success: true, status });
});

// PATCH /api/pay/settings — save merchant UPI + merchant name
router.patch('/settings', requireAuth, (req, res) => {
    const { tgId } = req.session.user;
    const { upi_id, payment_qr, merchant_name } = req.body;
    try { db.exec(`ALTER TABLE shops ADD COLUMN merchant_name TEXT DEFAULT ''`); } catch { }
    const shop = db.prepare('SELECT id FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });
    if (upi_id !== undefined) db.prepare('UPDATE shops SET upi_id = ? WHERE tg_id = ?').run(upi_id, tgId);
    if (payment_qr !== undefined) db.prepare('UPDATE shops SET payment_qr = ? WHERE tg_id = ?').run(payment_qr, tgId);
    if (merchant_name !== undefined) db.prepare('UPDATE shops SET merchant_name = ? WHERE tg_id = ?').run(merchant_name, tgId);
    res.json({ success: true });
});

function safeJson(str) { try { return JSON.parse(str || '[]'); } catch { return []; } }

module.exports = router;

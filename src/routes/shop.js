const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer config — store uploaded images in public/uploads/
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `product-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp|gif/;
        if (allowed.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF)'));
    }
});

// GET /api/shop/my — get current user's shop info + products
router.get('/my', requireAuth, (req, res) => {
    const { tgId } = req.session.user;
    const shop = db.prepare('SELECT * FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found. Contact admin.' });

    const user = db.prepare('SELECT * FROM users WHERE tg_id = ?').get(tgId);
    const isSuperOrAdmin = req.session.user.role === 'superAdmin' || req.session.user.role === 'admin';
    if (!isSuperOrAdmin && user && new Date(user.expires_at) < new Date()) {
        return res.status(403).json({ error: 'Your access has expired.' });
    }

    const products = db.prepare('SELECT * FROM products WHERE shop_id = ? ORDER BY id ASC').all(shop.id);
    const parsed = products.map(p => ({ ...p, reviews: JSON.parse(p.reviews) }));
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ shop, products: parsed, shopUrl: `${baseUrl}/shop/${shop.slug}` });
});

// GET /api/shop/info/:slug — public endpoint for shop page
router.get('/info/:slug', (req, res) => {
    const shop = db.prepare('SELECT * FROM shops WHERE slug = ?').get(req.params.slug);
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });

    const user = db.prepare('SELECT * FROM users WHERE tg_id = ?').get(shop.tg_id);
    const isSuperAdmin = shop.tg_id === process.env.SUPER_ADMIN_TG_ID;
    const isAdmin = db.prepare('SELECT 1 FROM admins WHERE tg_id = ?').get(shop.tg_id);

    if (!isSuperAdmin && !isAdmin && user && new Date(user.expires_at) < new Date()) {
        return res.status(410).json({ error: 'expired', message: 'This shop is no longer available.' });
    }

    const products = db.prepare('SELECT * FROM products WHERE shop_id = ? ORDER BY id ASC').all(shop.id);
    const parsed = products.map(p => ({ ...p, reviews: JSON.parse(p.reviews) }));
    res.json({ shop, products: parsed });
});

// POST /api/shop/upload — upload product image from device
router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ success: true, url: `${baseUrl}/uploads/${req.file.filename}` });
});

// PATCH /api/shop/products/:id — edit product (name, image, price, description, rating)
router.patch('/products/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { tgId, role } = req.session.user;

    const product = db.prepare(`
    SELECT p.*, s.tg_id as shop_owner FROM products p
    JOIN shops s ON s.id = p.shop_id WHERE p.id = ?
  `).get(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (product.shop_owner !== tgId && role !== 'admin' && role !== 'superAdmin') {
        return res.status(403).json({ error: 'You can only edit products in your own shop.' });
    }

    const { name, image_url, price, original_price, discount, description, rating } = req.body;
    const updates = [], values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (image_url) { updates.push('image_url = ?'); values.push(image_url); }
    if (price != null) { updates.push('price = ?'); values.push(parseInt(price)); }
    if (original_price != null) { updates.push('original_price = ?'); values.push(parseInt(original_price)); }
    if (discount != null) { updates.push('discount = ?'); values.push(parseInt(discount)); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (rating != null) { updates.push('rating = ?'); values.push(parseFloat(rating)); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update.' });
    values.push(id);
    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, product: { ...updated, reviews: JSON.parse(updated.reviews) } });
});

// PATCH /api/shop/settings — update shop name / banner / payment
router.patch('/settings', requireAuth, (req, res) => {
    const { tgId } = req.session.user;
    const { shop_name, banner_text, upi_id, payment_qr } = req.body;
    const shop = db.prepare('SELECT * FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });

    // Migrate columns if they don't exist (for existing DBs)
    try { db.exec(`ALTER TABLE shops ADD COLUMN upi_id TEXT DEFAULT ''`); } catch { }
    try { db.exec(`ALTER TABLE shops ADD COLUMN payment_qr TEXT DEFAULT ''`); } catch { }

    if (shop_name) db.prepare('UPDATE shops SET shop_name = ? WHERE tg_id = ?').run(shop_name, tgId);
    if (banner_text) db.prepare('UPDATE shops SET banner_text = ? WHERE tg_id = ?').run(banner_text, tgId);
    if (upi_id !== undefined) db.prepare('UPDATE shops SET upi_id = ? WHERE tg_id = ?').run(upi_id, tgId);
    if (payment_qr !== undefined) db.prepare('UPDATE shops SET payment_qr = ? WHERE tg_id = ?').run(payment_qr, tgId);
    res.json({ success: true });
});

// POST /api/shop/upload-qr — upload payment QR image
router.post('/upload-qr', requireAuth, upload.single('qr'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ success: true, url: `${baseUrl}/uploads/${req.file.filename}` });
});

// GET /api/shop/link
router.get('/link', requireAuth, (req, res) => {
    const shop = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(req.session.user.tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    res.json({ url: `${baseUrl}/shop/${shop.slug}`, slug: shop.slug });
});

// POST /api/shop/visitor — log visitor location + UA (public, no auth)
router.post('/visitor', (req, res) => {
    const { slug, lat, lng, city, country } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    db.prepare(`INSERT INTO visitors (shop_slug, ip, lat, lng, city, country, user_agent) VALUES (?,?,?,?,?,?,?)`)
        .run(slug, ip, lat || null, lng || null, city || '', country || '', ua);
    res.json({ success: true });
});

// POST /api/shop/checkout — log checkout details (public)
router.post('/checkout', (req, res) => {
    const { slug, name, email, phone, address, pincode, cart_items, total_amount } = req.body;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    db.prepare(`INSERT INTO visitors (shop_slug, ip, user_agent, name, email, phone, address, pincode, cart_items, total_amount)
                VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(slug, ip, ua, name || '', email || '', phone || '', address || '', pincode || '', JSON.stringify(cart_items || []), total_amount || 0);
    res.json({ success: true });
});

// GET /api/shop/visitors — get visitors for your shop (auth required)
router.get('/visitors', requireAuth, (req, res) => {
    const { tgId } = req.session.user;
    const shop = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });
    const visitors = db.prepare('SELECT * FROM visitors WHERE shop_slug = ? ORDER BY visited_at DESC LIMIT 200').all(shop.slug);
    res.json({ visitors });
});

// POST /api/shop/fetch-flipkart — fetch details from a given URL
router.post('/fetch-flipkart', requireAuth, async (req, res) => {
    let browser = null;
    try {
        const { url } = req.body;
        if (!url || !url.includes('flipkart.com')) {
            return res.status(400).json({ success: false, error: 'Valid Flipkart URL required.' });
        }

        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());
        const cheerio = require('cheerio');

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });

        const page = await browser.newPage();

        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Load page
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

        // Wait briefly for potential redirects or captchas
        await new Promise(r => setTimeout(r, 1500));

        const html = await page.content();
        const $ = cheerio.load(html);

        // Product Name
        let name = $('span.B_NuCI').text() || $('span.VU-ZEz').text() || $('h1').text() || '';
        name = name.trim();

        if (name.includes('Are you a human')) {
            return res.status(403).json({
                success: false,
                error: 'Flipkart Anti-Bot Captcha blocked the request. Try pasting the URL again later.'
            });
        }

        // Image
        let imageUrl = $('img._396cs4').attr('src') || $('img.v2bfbI').attr('src') || $('img.DByuf4').first().attr('src') || $('meta[property="og:image"]').attr('content') || '';
        if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        if (imageUrl && imageUrl.includes('?q=')) imageUrl = imageUrl.split('?q=')[0];

        // Price
        let priceStr = $('div._30jeq3._16Jk6d').first().text() || $('div.Nx9bqj.CxhGGd').first().text() || '';
        let origPriceStr = $('div._3I9_wc._2p6lqe').first().text() || $('div.yRaY8j.A60-Kx').first().text() || '';

        const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
        const original_price = parseInt(origPriceStr.replace(/[^0-9]/g, '')) || price;

        // Description
        let description = $('div._1mXcCf').text() || $('div.Rwb9CE').text() || $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        description = description.trim();

        // Rating
        let ratingStr = $('div._3LWZlK').first().text() || $('div.XQDdHH').first().text() || '4.5';
        const rating = parseFloat(ratingStr) || 4.5;

        res.json({
            success: true,
            product: {
                name: name || 'Scraped Product',
                image_url: imageUrl,
                price: price > 0 ? price : undefined,
                original_price: original_price > 0 ? original_price : undefined,
                description: description,
                rating: rating
            }
        });
    } catch (error) {
        console.error('Flipkart fetch error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch product details. Flipkart may be blocking automated requests.' });
    } finally {
        if (browser) await browser.close();
    }
});


module.exports = router;

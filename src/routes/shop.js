const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Auto-detect public base URL from request
function getBaseUrl(req) {
    if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${proto}://${host}`;
}

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
    const baseUrl = getBaseUrl(req);
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
    const baseUrl = getBaseUrl(req);
    res.json({ success: true, url: `${baseUrl}/uploads/${req.file.filename}` });
});

// POST /api/shop/products — add a new product to your shop
router.post('/products', requireAuth, (req, res) => {
    const { tgId, role } = req.session.user;
    const shop = db.prepare('SELECT * FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });

    const { name, category, image_url, price, original_price, description, rating, review_count } = req.body;
    if (!name || !category || !image_url || price == null || original_price == null) {
        return res.status(400).json({ error: 'name, category, image_url, price, and original_price are required.' });
    }

    const p = parseInt(price);
    const op = parseInt(original_price);
    const discount = op > 0 ? Math.max(0, Math.round(((op - p) / op) * 100)) : 0;
    const r = parseFloat(rating) || 4.5;
    const rc = parseInt(review_count) || 0;
    const reviews = JSON.stringify([]);

    const result = db.prepare(
        'INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(shop.id, name, category, image_url, p, op, discount, description || '', r, rc, reviews);

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, product: { ...product, reviews: JSON.parse(product.reviews) } });
});

// DELETE /api/shop/products/:id — delete a product
router.delete('/products/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { tgId, role } = req.session.user;

    const product = db.prepare(`
    SELECT p.*, s.tg_id as shop_owner FROM products p
    JOIN shops s ON s.id = p.shop_id WHERE p.id = ?
  `).get(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (product.shop_owner !== tgId && role !== 'admin' && role !== 'superAdmin') {
        return res.status(403).json({ error: 'You can only delete products in your own shop.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true });
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
    const baseUrl = getBaseUrl(req);
    res.json({ success: true, url: `${baseUrl}/uploads/${req.file.filename}` });
});

// GET /api/shop/link
router.get('/link', requireAuth, (req, res) => {
    const shop = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(req.session.user.tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });
    const baseUrl = getBaseUrl(req);
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
// Uses axios+cheerio first (fast), falls back to puppeteer if blocked
router.post('/fetch-flipkart', requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('flipkart')) {
        return res.status(400).json({ success: false, error: 'Valid Flipkart URL required.' });
    }

    const cheerio = require('cheerio');
    const axios = require('axios');

    // Resolve dl.flipkart.com short links to actual product URLs
    let resolvedUrl = url;
    if (url.includes('dl.flipkart.com')) {
        try {
            const headRes = await axios.head(url, {
                maxRedirects: 10,
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' }
            });
            resolvedUrl = headRes.request?.res?.responseUrl || headRes.request?._redirectable?._currentUrl || url;
        } catch (e) {
            if (e.response && e.response.headers && e.response.headers.location) {
                resolvedUrl = e.response.headers.location;
            } else if (e.request && e.request._redirectable && e.request._redirectable._currentUrl) {
                resolvedUrl = e.request._redirectable._currentUrl;
            }
        }
        // Clean up URL
        if (resolvedUrl.startsWith('//')) resolvedUrl = 'https:' + resolvedUrl;
        if (!resolvedUrl.includes('flipkart.com')) resolvedUrl = url; // fallback
        console.log('Resolved Flipkart URL:', resolvedUrl);
    }

    // Helper: extract product data from cheerio-loaded HTML
    function extractProduct($) {
        const pageText = $('body').text();
        if (pageText.includes('Are you a human') || pageText.includes('captcha')) return null;

        // Name
        let name = '';
        for (const sel of ['span.VU-ZEz', 'span.B_NuCI', 'h1.yhB1nd', 'h1 span', 'h1']) {
            name = $(sel).first().text().trim();
            if (name && name.length > 3) break;
        }
        if (!name) name = ($('meta[property="og:title"]').attr('content') || '').trim();

        // Image
        let imageUrl = '';
        for (const sel of ['img.DByuf4', 'img._396cs4', 'img.v2bfbI', 'img._2r_T1I', 'div._4WELSP img', 'img[loading="eager"]']) {
            imageUrl = $(sel).first().attr('src') || '';
            if (imageUrl) break;
        }
        if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr('content') || '';
        if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        if (imageUrl && imageUrl.includes('/128/')) imageUrl = imageUrl.replace('/128/', '/416/');

        // Price
        let priceStr = '';
        for (const sel of ['div.Nx9bqj.CxhGGd', 'div._30jeq3._16Jk6d', 'div.Nx9bqj', 'div._25b18c div._30jeq3']) {
            priceStr = $(sel).first().text().trim();
            if (priceStr) break;
        }

        // Original price
        let origPriceStr = '';
        for (const sel of ['div.yRaY8j.A6\\+E6v', 'div.yRaY8j.A60-Kx', 'div._3I9_wc._2p6lqe', 'div.yRaY8j', 'div._2p6lqe']) {
            origPriceStr = $(sel).first().text().trim();
            if (origPriceStr) break;
        }

        const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
        const original_price = parseInt(origPriceStr.replace(/[^0-9]/g, '')) || price;

        // Description
        let description = '';
        for (const sel of ['div.Rwb9CE', 'div._1mXcCf', 'div.xFVion']) {
            description = $(sel).first().text().trim();
            if (description && description.length > 10) break;
        }
        if (!description || description.length < 10) {
            const items = [];
            $('ul._2418kt li').each((i, el) => items.push($(el).text().trim()));
            if (items.length) description = items.slice(0, 5).join(' | ');
        }
        if (!description) description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

        // Rating
        let ratingStr = '4.5';
        for (const sel of ['div.XQDdHH', 'div._3LWZlK', 'span.Y1HWO0']) {
            ratingStr = $(sel).first().text().trim();
            if (ratingStr && !isNaN(parseFloat(ratingStr))) break;
        }
        const rating = parseFloat(ratingStr) || 4.5;

        return {
            name: name || 'Product',
            image_url: imageUrl,
            price: price > 0 ? price : undefined,
            original_price: original_price > 0 ? original_price : undefined,
            description: description.trim(),
            rating
        };
    }

    // ── ATTEMPT 1: Fast fetch with axios (no browser needed) ──
    try {
        const { data: html } = await axios.get(resolvedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            timeout: 15000,
            maxRedirects: 10
        });
        const $ = cheerio.load(html);
        const product = extractProduct($);
        if (product && product.name && product.name !== 'Product' && product.name.length > 3) {
            return res.json({ success: true, product });
        }
    } catch (e) {
        console.log('Axios desktop fetch failed:', e.message);
    }

    // ── ATTEMPT 1.5: Axios with mobile user-agent (Flipkart mobile is simpler HTML) ──
    try {
        const mobileUrl = resolvedUrl.replace('www.flipkart.com', 'www.flipkart.com');
        const { data: html } = await axios.get(mobileUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000,
            maxRedirects: 10
        });
        const $ = cheerio.load(html);
        const product = extractProduct($);
        if (product && product.name && product.name !== 'Product' && product.name.length > 3) {
            return res.json({ success: true, product });
        }
    } catch (e) {
        console.log('Axios mobile fetch failed:', e.message);
    }

    // ── ATTEMPT 2: Puppeteer with stealth (slower but handles JS-rendered pages) ──
    let browser = null;
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox', '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security', '--disable-features=IsolateOrigins',
                '--disable-site-isolation-trials'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        });

        await page.goto(resolvedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2500));

        const html = await page.content();
        const $ = cheerio.load(html);
        const product = extractProduct($);

        if (!product) {
            return res.status(403).json({
                success: false,
                error: 'Flipkart blocked the request (captcha). Try again in a few minutes.'
            });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Flipkart puppeteer fetch error:', error.message);
        res.status(500).json({ success: false, error: 'Could not fetch product details. Try again or enter details manually.' });
    } finally {
        if (browser) await browser.close();
    }
});


module.exports = router;

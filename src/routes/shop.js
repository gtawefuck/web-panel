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
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        const page = await browser.newPage();

        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // Set extra headers to appear more like a real browser
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        });

        // Load page with networkidle0 for better content loading
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for content to load
        await new Promise(r => setTimeout(r, 2000));

        const html = await page.content();
        const $ = cheerio.load(html);

        // Check for captcha/bot detection
        const pageText = $('body').text();
        if (pageText.includes('Are you a human') || pageText.includes('captcha') || pageText.includes('robot')) {
            return res.status(403).json({
                success: false,
                error: 'Flipkart Anti-Bot Captcha blocked the request. Try pasting the URL again later.'
            });
        }

        // Product Name - updated selectors for current Flipkart layout
        let name = '';
        const nameSelectors = [
            'span.VU-ZEz',           // New product page title
            'span.B_NuCI',           // Legacy selector
            'h1.yhB1nd',             // Alternative h1 class
            'h1 span',               // Generic h1 span
            '.product-title',        // Generic class
            'meta[property="og:title"]'
        ];
        for (const sel of nameSelectors) {
            if (sel.startsWith('meta')) {
                name = $(sel).attr('content') || '';
            } else {
                name = $(sel).first().text().trim();
            }
            if (name && name.length > 3) break;
        }

        // Image - updated selectors
        let imageUrl = '';
        const imgSelectors = [
            'img.DByuf4',            // Main product image
            'img._396cs4',           // Legacy selector
            'img.v2bfbI',            // Alternative selector
            'img._2r_T1I',           // Another variant
            'img[loading="eager"]',  // Main loaded image
            'div._4WELSP img',       // Image container
            'meta[property="og:image"]'
        ];
        for (const sel of imgSelectors) {
            if (sel.startsWith('meta')) {
                imageUrl = $(sel).attr('content') || '';
            } else {
                imageUrl = $(sel).first().attr('src') || '';
            }
            if (imageUrl) break;
        }
        if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        // Get higher quality image by removing size params
        if (imageUrl && imageUrl.includes('?q=')) imageUrl = imageUrl.split('?q=')[0];
        if (imageUrl && imageUrl.includes('/128/')) imageUrl = imageUrl.replace('/128/', '/416/');

        // Price - updated selectors
        let priceStr = '';
        const priceSelectors = [
            'div.Nx9bqj.CxhGGd',     // New price class
            'div._30jeq3._16Jk6d',   // Legacy price
            'div.Nx9bqj',            // Alternative
            'div._25b18c div._30jeq3',
            '.price-current',
            'meta[itemprop="price"]'
        ];
        for (const sel of priceSelectors) {
            if (sel.startsWith('meta')) {
                priceStr = $(sel).attr('content') || '';
            } else {
                priceStr = $(sel).first().text().trim();
            }
            if (priceStr) break;
        }

        // Original Price
        let origPriceStr = '';
        const origPriceSelectors = [
            'div.yRaY8j.A6\\+E6v',   // New original price (strikethrough)
            'div.yRaY8j.A6+E6v',     // Without escape
            'div._3I9_wc._2p6lqe',   // Legacy
            'div.yRaY8j',            // Alternative
            'div._2p6lqe'            // Legacy alternative
        ];
        for (const sel of origPriceSelectors) {
            origPriceStr = $(sel).first().text().trim();
            if (origPriceStr) break;
        }

        const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
        const original_price = parseInt(origPriceStr.replace(/[^0-9]/g, '')) || price;

        // Description - updated selectors
        let description = '';
        const descSelectors = [
            'div.Rwb9CE',            // Highlights/description area
            'div._1mXcCf',           // Legacy description
            'div.xFVion',            // Product highlights
            'ul._2418kt li',         // Feature list
            'meta[name="description"]',
            'meta[property="og:description"]'
        ];
        for (const sel of descSelectors) {
            if (sel.startsWith('meta')) {
                description = $(sel).attr('content') || '';
            } else if (sel.includes(' li')) {
                // For list items, join them
                const items = [];
                $(sel).each((i, el) => items.push($(el).text().trim()));
                description = items.slice(0, 5).join(' | ');
            } else {
                description = $(sel).first().text().trim();
            }
            if (description && description.length > 10) break;
        }

        // Rating - updated selectors
        let ratingStr = '4.5';
        const ratingSelectors = [
            'div.XQDdHH',            // New rating badge
            'div._3LWZlK',           // Legacy rating
            'span.Y1HWO0',           // Alternative
            'div.XQDdHH._1Quie7'     // Rating with reviews
        ];
        for (const sel of ratingSelectors) {
            ratingStr = $(sel).first().text().trim();
            if (ratingStr && !isNaN(parseFloat(ratingStr))) break;
        }
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

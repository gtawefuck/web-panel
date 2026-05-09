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
// Flatten the rich product envelope stored in the `reviews` column.
// Older rows store a plain array of reviews; newer ones store an object
// { reviews, highlights, images, specifications, ratings_breakdown, brand, color_variants }.
function flattenProduct(p) {
    let parsed;
    try { parsed = JSON.parse(p.reviews || '[]'); } catch (_) { parsed = []; }
    if (Array.isArray(parsed)) {
        return { ...p, reviews: parsed };
    }
    return {
        ...p,
        reviews: parsed.reviews || [],
        highlights: parsed.highlights || [],
        images: parsed.images && parsed.images.length ? parsed.images : [p.image_url],
        specifications: parsed.specifications || [],
        ratings_breakdown: parsed.ratings_breakdown || null,
        brand: parsed.brand || '',
        color_variants: parsed.color_variants || [],
        sizes: parsed.sizes || [],
        colors: parsed.colors || parsed.color_variants || [],
        video_url: parsed.video_url || '',
        a_plus_images: parsed.a_plus_images || []
    };
}

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
    const parsed = products.map(flattenProduct);
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
    const parsed = products.map(flattenProduct);
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

    const { name, category, image_url, price, original_price, description, rating, review_count,
            images, highlights, specifications, reviews: reviewsData, ratings_breakdown, brand,
            sizes, colors, color_variants, video_url, a_plus_images } = req.body;
    if (!name || !category || !image_url || price == null || original_price == null) {
        return res.status(400).json({ error: 'name, category, image_url, price, and original_price are required.' });
    }

    const p = parseInt(price);
    const op = parseInt(original_price);
    const discount = op > 0 ? Math.max(0, Math.round(((op - p) / op) * 100)) : 0;
    const r = parseFloat(rating) || 4.5;
    const rc = parseInt(review_count) || 0;

    // Build rich reviews JSON envelope (same structure as seed data)
    const reviewsEnvelope = {
        reviews: Array.isArray(reviewsData) ? reviewsData : [],
        images: Array.isArray(images) ? images : [],
        highlights: Array.isArray(highlights) ? highlights : [],
        specifications: Array.isArray(specifications) ? specifications : [],
        ratings_breakdown: ratings_breakdown || {},
        brand: brand || '',
        sizes: Array.isArray(sizes) ? sizes : (typeof sizes === 'string' && sizes ? sizes.split(',').map(s => s.trim()) : []),
        colors: Array.isArray(colors) ? colors : (Array.isArray(color_variants) ? color_variants : (typeof colors === 'string' && colors ? colors.split(',').map(s => s.trim()) : [])),
        color_variants: Array.isArray(color_variants) ? color_variants : (Array.isArray(colors) ? colors : []),
        video_url: video_url || '',
        a_plus_images: Array.isArray(a_plus_images) ? a_plus_images : (typeof a_plus_images === 'string' && a_plus_images ? a_plus_images.split(',').map(s => s.trim()) : []),
    };
    const reviews = JSON.stringify(reviewsEnvelope);

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

// POST /api/shop/fetch-product — universal product fetcher (Flipkart + Amazon)
router.post('/fetch-product', requireAuth, async (req, res) => {
    const { url, custom_price } = req.body;
    if (!url) {
        return res.status(400).json({ success: false, error: 'Product URL required.' });
    }

    const isAmazon = url.includes('amazon.in') || url.includes('amazon.com') || url.includes('amzn.');
    const isFlipkart = url.includes('flipkart');

    if (!isAmazon && !isFlipkart) {
        return res.status(400).json({ success: false, error: 'Only Flipkart and Amazon URLs are supported.' });
    }

    const cheerio = require('cheerio');
    const axios = require('axios');

    if (isAmazon) {
        // ─── Amazon scraping ───
        let resolvedUrl = url;
        if (url.includes('amzn.')) {
            try {
                const headRes = await axios.head(url, {
                    maxRedirects: 10, timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' }
                });
                resolvedUrl = headRes.request?.res?.responseUrl || headRes.request?._redirectable?._currentUrl || url;
            } catch (e) {
                if (e.response?.headers?.location) resolvedUrl = e.response.headers.location;
                else if (e.request?._redirectable?._currentUrl) resolvedUrl = e.request._redirectable._currentUrl;
            }
        }

        function extractAmazonProduct($) {
            const pageText = $('body').text();
            if (pageText.includes('Enter the characters you see below') || pageText.includes('Robot Check')) return null;

            // Name
            let name = $('#productTitle').text().trim();
            if (!name) name = $('span#productTitle, h1#title span').text().trim();

            // Main image
            let imageUrl = '';
            const imgData = $('img#landingImage, img#imgBlkFront').attr('data-old-hires') ||
                            $('img#landingImage, img#imgBlkFront').attr('src') || '';
            imageUrl = imgData;
            if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr('content') || '';

            // All gallery images
            const images = [];
            const seenImgs = new Set();
            // Try to extract from image data JSON in script tags
            const scripts = $('script').toArray();
            for (const s of scripts) {
                const text = $(s).html() || '';
                const match = text.match(/'colorImages'\s*:\s*\{[^}]*'initial'\s*:\s*(\[[\s\S]*?\])\s*\}/);
                if (match) {
                    try {
                        const imgArr = JSON.parse(match[1]);
                        imgArr.forEach(img => {
                            const hiRes = img.hiRes || img.large || img.thumb || '';
                            if (hiRes && !seenImgs.has(hiRes)) { seenImgs.add(hiRes); images.push(hiRes); }
                        });
                    } catch (_) {}
                }
            }
            // Fallback: scrape from image thumbnails
            if (!images.length) {
                $('li.imageThumbnail img, div.imgTagWrapper img, img.s-image').each((i, el) => {
                    let src = $(el).attr('src') || '';
                    src = src.replace(/\._[A-Z]+\d+_\./, '._SL1500_.');
                    if (src && !seenImgs.has(src)) { seenImgs.add(src); images.push(src); }
                });
            }
            if (imageUrl && !seenImgs.has(imageUrl)) images.unshift(imageUrl);
            if (!images.length && imageUrl) images.push(imageUrl);

            // Price
            let priceStr = '';
            for (const sel of ['span.a-price-whole', 'span#priceblock_ourprice', 'span#priceblock_dealprice', 'span.priceToPay span.a-price-whole']) {
                priceStr = $(sel).first().text().trim();
                if (priceStr) break;
            }
            let origPriceStr = '';
            $('span.a-price.a-text-price span.a-offscreen, span.priceBlockStrikePriceString').each((i, el) => {
                if (!origPriceStr) origPriceStr = $(el).text().trim();
            });

            const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
            const original_price = parseInt(origPriceStr.replace(/[^0-9]/g, '')) || price;

            // Rating
            let ratingStr = $('span.a-icon-alt').first().text().trim();
            const rating = parseFloat(ratingStr) || 4.0;

            // Review count
            let reviewCountStr = $('span#acrCustomerReviewCount').text().trim();
            const review_count = parseInt(reviewCountStr.replace(/[^0-9]/g, '')) || 0;

            // Brand
            let brand = $('a#bylineInfo').text().trim().replace(/^(Visit the |Brand: )/, '').replace(/ Store$/, '');
            if (!brand) brand = $('tr.po-brand td.a-span9 span').text().trim();

            // Category from breadcrumbs
            let category = '';
            $('ul.a-unordered-list.a-horizontal a.a-link-normal').each((i, el) => {
                const t = $(el).text().trim();
                if (t && t.length > 1) category = t;
            });

            // Highlights / bullet points
            const highlights = [];
            $('ul.a-unordered-list.a-vertical.a-spacing-mini li span.a-list-item, div#feature-bullets ul li span').each((i, el) => {
                const t = $(el).text().trim();
                if (t && t.length > 5 && !t.includes('Click here') && !t.includes('Make sure')) highlights.push(t);
            });

            // Description
            let description = highlights.length ? highlights.slice(0, 5).join(' | ') : '';
            if (!description) description = $('div#productDescription p').text().trim();
            if (!description) description = $('meta[name="description"]').attr('content') || '';

            // Sizes / variants
            const sizes = [];
            $('li[data-dp-url] span.a-size-base.swatch-title-text, select#native_dropdown_selected_size_name option').each((i, el) => {
                const t = $(el).text().trim();
                if (t && t !== 'Select' && !sizes.includes(t)) sizes.push(t);
            });
            // Also extract from variation dimensions
            $('span.selection, span.a-dropdown-prompt').each((i, el) => {
                const t = $(el).text().trim();
                if (t && t.length < 30 && !sizes.includes(t)) sizes.push(t);
            });

            // Colors
            const colors = [];
            $('li[data-dp-url] img.imgSwatch, li.swatchAvailable img.imgSwatch').each((i, el) => {
                const alt = $(el).attr('alt') || '';
                if (alt && !colors.includes(alt)) colors.push(alt);
            });
            // Fallback
            if (!colors.length) {
                $('span.swatch-title-text-display, li.swatchAvailable span.a-declarative').each((i, el) => {
                    const t = $(el).text().trim();
                    if (t && t.length < 40 && !colors.includes(t)) colors.push(t);
                });
            }

            // Video URL
            let videoUrl = '';
            for (const s of scripts) {
                const text = $(s).html() || '';
                const vidMatch = text.match(/"url"\s*:\s*"(https:\/\/[^"]*\.mp4[^"]*)"/);
                if (vidMatch) { videoUrl = vidMatch[1]; break; }
            }

            // A+ content images
            const aPlusImages = [];
            const seenAPlus = new Set();
            $('div#aplus img, div.aplus-module img, div#dpx-aplus-product-description_feature_div img').each((i, el) => {
                let src = $(el).attr('data-src') || $(el).attr('src') || '';
                if (src && src.startsWith('http') && !seenAPlus.has(src) && !src.includes('sprite') && !src.includes('icon')) {
                    seenAPlus.add(src);
                    aPlusImages.push(src);
                }
            });

            // Specifications
            const specifications = [];
            const techItems = [];
            $('table.a-keyvalue tr, table#productDetails_techSpec_section_1 tr, table#productDetails_detailBullets_sections1 tr').each((i, el) => {
                const label = $(el).find('th, td.a-span3').first().text().trim();
                const value = $(el).find('td.a-span9, td:last-child').text().trim();
                if (label && value && label !== value) techItems.push({ label, value });
            });
            if (techItems.length) specifications.push({ group: 'Technical Details', items: techItems });

            // Reviews
            const reviews = [];
            $('div[data-hook="review"]').each((i, el) => {
                if (i >= 10) return false;
                const rVal = parseFloat($(el).find('i.review-rating span.a-icon-alt').text()) || 5;
                const title = $(el).find('a[data-hook="review-title"] span:last-child, span[data-hook="review-title"]').text().trim();
                const text = $(el).find('span[data-hook="review-body"] span').text().trim();
                const user = $(el).find('span.a-profile-name').text().trim();
                if (title || text) reviews.push({ rating: rVal, title, text, user: user || 'Amazon Customer' });
            });

            return {
                name: name || 'Product',
                image_url: images[0] || imageUrl,
                images: images.slice(0, 5),
                price: price > 0 ? price : undefined,
                original_price: original_price > 0 ? original_price : undefined,
                description: description.trim(),
                rating,
                review_count,
                brand,
                category: category || 'General',
                highlights,
                specifications,
                reviews,
                ratings_breakdown: {},
                sizes,
                colors,
                color_variants: colors,
                video_url: videoUrl,
                a_plus_images: aPlusImages
            };
        }

        // Try axios first
        try {
            const { data: html } = await axios.get(resolvedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                },
                timeout: 15000, maxRedirects: 10
            });
            const $ = cheerio.load(html);
            const product = extractAmazonProduct($);
            if (product && product.name && product.name !== 'Product' && product.name.length > 3) {
                if (custom_price) product.price = parseInt(custom_price);
                return res.json({ success: true, product });
            }
        } catch (e) {
            console.log('Amazon axios fetch failed:', e.message);
        }

        // Fallback: Puppeteer
        let browser = null;
        try {
            const puppeteer = require('puppeteer-extra');
            const StealthPlugin = require('puppeteer-extra-plugin-stealth');
            puppeteer.use(StealthPlugin());
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1366, height: 768 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            await page.goto(resolvedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 3000));
            const html = await page.content();
            const $ = cheerio.load(html);
            const product = extractAmazonProduct($);
            if (product) {
                if (custom_price) product.price = parseInt(custom_price);
                return res.json({ success: true, product });
            }
            res.status(403).json({ success: false, error: 'Amazon blocked the request. Try again.' });
        } catch (error) {
            console.error('Amazon puppeteer error:', error.message);
            res.status(500).json({ success: false, error: 'Could not fetch from Amazon. Try again.' });
        } finally {
            if (browser) await browser.close();
        }
        return;
    }

    // ─── Flipkart scraping (existing logic, enhanced) ───

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

    // Helper: normalize image URL
    function fixImgUrl(url) {
        if (!url) return '';
        if (url.startsWith('//')) url = 'https:' + url;
        // Upscale small Flipkart thumbnails
        url = url.replace(/\/\d+\/\d+\?/, '/416/416?');
        url = url.replace(/\/128\//, '/416/');
        return url;
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

        // Main image
        let imageUrl = '';
        for (const sel of ['img.DByuf4', 'img._396cs4', 'img.v2bfbI', 'img._2r_T1I', 'div._4WELSP img', 'img[loading="eager"]']) {
            imageUrl = $(sel).first().attr('src') || '';
            if (imageUrl) break;
        }
        if (!imageUrl) imageUrl = $('meta[property="og:image"]').attr('content') || '';
        imageUrl = fixImgUrl(imageUrl);

        // All gallery images
        const images = [];
        const seenImgs = new Set();
        $('div._4WELSP img, ul.ZqtVYK img, div.q6DClP img, li.Gy4kBe img, div._3kidJX img').each((i, el) => {
            let src = $(el).attr('src') || '';
            src = fixImgUrl(src);
            if (src && !seenImgs.has(src)) { seenImgs.add(src); images.push(src); }
        });
        if (imageUrl && !seenImgs.has(imageUrl)) images.unshift(imageUrl);
        if (!images.length && imageUrl) images.push(imageUrl);

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

        // Highlights
        const highlights = [];
        $('li._7eSDEz, li.rgWa7D, ul._2418kt li, div._2cM9lP li').each((i, el) => {
            const t = $(el).text().trim();
            if (t && t.length > 3) highlights.push(t);
        });

        // Description
        let description = '';
        if (highlights.length) {
            description = highlights.slice(0, 5).join(' | ');
        }
        if (!description || description.length < 10) {
            for (const sel of ['div.Rwb9CE', 'div._1mXcCf', 'div.xFVion']) {
                description = $(sel).first().text().trim();
                if (description && description.length > 10) break;
            }
        }
        if (!description) description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

        // Rating
        let ratingStr = '4.5';
        for (const sel of ['div.XQDdHH', 'div._3LWZlK', 'span.Y1HWO0']) {
            ratingStr = $(sel).first().text().trim();
            if (ratingStr && !isNaN(parseFloat(ratingStr))) break;
        }
        const rating = parseFloat(ratingStr) || 4.5;

        // Rating & review count
        let review_count = 0;
        for (const sel of ['span.Wphh3N', 'span._2_R_DZ', 'div.row span:contains("Ratings")']) {
            const text = $(sel).first().text().trim();
            const m = text.match(/([\d,]+)\s*(Ratings|Reviews)/i);
            if (m) { review_count = parseInt(m[1].replace(/,/g, '')) || 0; break; }
        }

        // Brand
        let brand = '';
        $('td, span').each((i, el) => {
            const t = $(el).text().trim();
            if (t === 'Brand') {
                const next = $(el).next('td, span').text().trim();
                if (next) brand = next;
            }
        });
        if (!brand && name) {
            const firstWord = name.split(/\s+/)[0];
            if (firstWord && firstWord.length > 1) brand = firstWord;
        }

        // Category from breadcrumb
        let category = '';
        $('a._2whKao, a.R0cyWM, div._1MR4o5 a').each((i, el) => {
            const t = $(el).text().trim();
            if (t && t !== 'Home' && !t.includes('flipkart') && t.length > 1) category = t;
        });
        if (!category) category = $('meta[property="og:category"]').attr('content') || '';

        // Specifications (grouped)
        const specifications = [];
        $('div._4BJ2V\\+, div.GNDEQ-, div._3dtsli, div.X3BRps').each((i, groupEl) => {
            const groupTitle = $(groupEl).find('div._4BJ2V\\+ div, div.GNDEQ- div, p._7xINBo, div._2UDBK0').first().text().trim() ||
                               $(groupEl).prev('div').text().trim() || 'General';
            const items = [];
            $(groupEl).find('tr._1s_Smc, tr.WJdYP6, tr.s-zhNu, tr').each((j, row) => {
                const cols = $(row).find('td');
                if (cols.length >= 2) {
                    const label = $(cols[0]).text().trim();
                    const value = $(cols[1]).text().trim();
                    if (label && value) items.push({ label, value });
                }
            });
            if (items.length) specifications.push({ group: groupTitle, items });
        });

        // Reviews
        const reviews = [];
        $('div._27M-vq, div.col._2wzgFH, div._1AtVbE').each((i, el) => {
            if (i >= 10) return false;
            const rEl = $(el).find('div._3LWZlK, div.XQDdHH').first();
            const rVal = parseFloat(rEl.text().trim()) || 5;
            const title = $(el).find('p._2-N8zT, p.z9E0IG').first().text().trim();
            const text = $(el).find('div.t-ZTKy, div.ZmyHeo, div:not(._3LWZlK):not(.XQDdHH)').filter(function() {
                return $(this).children().length === 0 && $(this).text().trim().length > 20;
            }).first().text().trim();
            const user = $(el).find('p._2sc7ZR, p._2NsDsF').first().text().trim();
            if (title || text) {
                reviews.push({ rating: rVal, title, text, user: user || 'Flipkart Customer' });
            }
        });

        // Ratings breakdown (5★ to 1★ counts)
        const ratings_breakdown = {};
        $('div._1BmBKS, div._5lw2by, li._1jcMtp, div._6RQhp0').each((i, el) => {
            const star = 5 - i;
            if (star < 1) return false;
            const countText = $(el).find('div.Wksx1e, div._3LWZlK, span').last().text().trim().replace(/,/g, '');
            const count = parseInt(countText) || 0;
            ratings_breakdown[star] = count;
        });

        // Color variants
        const color_variants = [];
        $('li._4lDvGd, li._3V2wfe, a._3GnIPe, li.XEk3tC').each((i, el) => {
            const t = $(el).attr('title') || $(el).find('div').text().trim();
            if (t && t.length < 40 && !color_variants.includes(t)) color_variants.push(t);
        });
        // Also check the dimensions row
        $('div._3Nuiag a, a._1fGeJ5, div._3V2wfe div').each((i, el) => {
            const txt = $(el).text().trim();
            if (txt && txt.length < 30 && !color_variants.includes(txt) && !txt.match(/^\d+$/)) {
                // Check if this looks like a color name
                const colorish = /^[A-Z][a-z]/.test(txt) || txt.includes('Black') || txt.includes('White') || txt.includes('Blue') || txt.includes('Red') || txt.includes('Green') || txt.includes('Gold') || txt.includes('Silver') || txt.includes('Grey') || txt.includes('Purple');
                if (colorish) color_variants.push(txt);
            }
        });

        // Sizes / variants
        const sizes = [];
        $('a._1fGeJ5, li._4lDvGd a, div._3Nuiag a').each((i, el) => {
            const t = $(el).text().trim();
            // Check if it looks like a size (numbers, GB, RAM, etc.)
            if (t && t.length < 30 && !sizes.includes(t)) {
                const sizeish = /\d+\s*(GB|TB|MB|RAM|ROM|inch|cm|mm|kg|g|L|M|S|XL|XXL|XS)/i.test(t) || /^[SMLX]{1,3}$/.test(t);
                if (sizeish) sizes.push(t);
            }
        });
        // Also from specification values
        specifications.forEach(group => {
            if (group.items) {
                group.items.forEach(item => {
                    if (/RAM|Storage|Internal/i.test(item.label)) {
                        const v = item.value.trim();
                        if (v && !sizes.includes(v)) sizes.push(v);
                    }
                });
            }
        });

        // Video URL
        let videoUrl = '';
        const allScripts = $('script').toArray();
        for (const s of allScripts) {
            const txt = $(s).html() || '';
            const vidMatch = txt.match(/"url"\s*:\s*"(https?:\/\/[^"]*\.mp4[^"]*)"/);
            if (vidMatch) { videoUrl = vidMatch[1]; break; }
            const vidMatch2 = txt.match(/"videoUrl"\s*:\s*"(https?:\/\/[^"]*)/);
            if (vidMatch2) { videoUrl = vidMatch2[1]; break; }
        }

        // A+ content images (rich product description images below main content)
        const aPlusImages = [];
        const seenAPlus = new Set();
        $('div._2fQJnc img, div._3k-BhJ img, div.xFVion img, div._2E51Ij img, div._2DsaLU img, div._3Rrcbo img').each((i, el) => {
            let src = $(el).attr('data-src') || $(el).attr('src') || '';
            if (src.startsWith('//')) src = 'https:' + src;
            src = src.replace(/\/\d+\/\d+\?/, '/832/832?');
            if (src && src.startsWith('http') && !seenAPlus.has(src) && !src.includes('sprite') && !src.includes('icon')) {
                seenAPlus.add(src);
                aPlusImages.push(src);
            }
        });

        return {
            name: name || 'Product',
            image_url: imageUrl,
            images,
            price: price > 0 ? price : undefined,
            original_price: original_price > 0 ? original_price : undefined,
            description: description.trim(),
            rating,
            review_count,
            brand,
            category,
            highlights,
            specifications,
            reviews,
            ratings_breakdown,
            sizes,
            colors: color_variants,
            color_variants,
            video_url: videoUrl,
            a_plus_images: aPlusImages
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
            if (custom_price) product.price = parseInt(custom_price);
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
            if (custom_price) product.price = parseInt(custom_price);
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

        if (custom_price) product.price = parseInt(custom_price);
        res.json({ success: true, product });
    } catch (error) {
        console.error('Flipkart puppeteer fetch error:', error.message);
        res.status(500).json({ success: false, error: 'Could not fetch product details. Try again or enter details manually.' });
    } finally {
        if (browser) await browser.close();
    }
});




// POST /api/shop/fetch-flipkart-category — fetch multiple products from a category/search page
router.post('/fetch-flipkart-category', requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('flipkart')) {
        return res.status(400).json({ success: false, error: 'Valid Flipkart URL required.' });
    }

    const cheerio = require('cheerio');
    const axios = require('axios');

    let resolvedUrl = url;
    if (url.includes('dl.flipkart.com')) {
        try {
            const headRes = await axios.head(url, {
                maxRedirects: 10, timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36' }
            });
            resolvedUrl = headRes.request?.res?.responseUrl || headRes.request?._redirectable?._currentUrl || url;
        } catch (e) {
            if (e.response?.headers?.location) resolvedUrl = e.response.headers.location;
            else if (e.request?._redirectable?._currentUrl) resolvedUrl = e.request._redirectable._currentUrl;
        }
        if (resolvedUrl.startsWith('//')) resolvedUrl = 'https:' + resolvedUrl;
        if (!resolvedUrl.includes('flipkart.com')) resolvedUrl = url;
    }

    function fixImgUrl(u) {
        if (!u) return '';
        if (u.startsWith('//')) u = 'https:' + u;
        u = u.replace(/\/\d+\/\d+\?/, '/416/416?').replace(/\/128\//, '/416/');
        return u;
    }

    function extractCategoryProducts($) {
        const products = [];
        const seenNames = new Set();

        // Flipkart category page product cards
        const cardSelectors = [
            'div._1AtVbE', 'div._4ddWXP', 'div._2kHMtA', 'div._1xHGtK._373qXS',
            'a._1fQZEK', 'div._13oc-S', 'div.slAVV4', 'div._1sdMkc',
            'a.CGtC98', 'div.tUxRFH', 'div._75nlfW', 'div.cPHDOP'
        ];

        for (const sel of cardSelectors) {
            $(sel).each((i, el) => {
                if (products.length >= 30) return false;

                let name = '';
                for (const ns of ['div._4rR01T', 'a.s1Q9rs', 'a.IRpwTa', 'div.KzDlHZ', 'a.WKTcLC']) {
                    name = $(el).find(ns).first().text().trim();
                    if (name && name.length > 3) break;
                }
                if (!name) {
                    name = $(el).find('a[title]').first().attr('title') || '';
                }
                if (!name || name.length < 3 || seenNames.has(name)) return;
                seenNames.add(name);

                let imageUrl = '';
                for (const is of ['img._396cs4', 'img.DByuf4', 'img._2r_T1I', 'img']) {
                    imageUrl = $(el).find(is).first().attr('src') || '';
                    if (imageUrl) break;
                }
                imageUrl = fixImgUrl(imageUrl);

                let priceStr = '';
                for (const ps of ['div._30jeq3', 'div.Nx9bqj']) {
                    priceStr = $(el).find(ps).first().text().trim();
                    if (priceStr) break;
                }
                let origPriceStr = '';
                for (const os of ['div._3I9_wc', 'div.yRaY8j']) {
                    origPriceStr = $(el).find(os).first().text().trim();
                    if (origPriceStr) break;
                }
                const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
                const original_price = parseInt(origPriceStr.replace(/[^0-9]/g, '')) || price;

                let ratingStr = '';
                for (const rs of ['div._3LWZlK', 'div.XQDdHH', 'span.Y1HWO0']) {
                    ratingStr = $(el).find(rs).first().text().trim();
                    if (ratingStr) break;
                }
                const rating = parseFloat(ratingStr) || 4.0;

                let reviewCountStr = '';
                const rcEl = $(el).find('span._2_R_DZ, span.Wphh3N').first().text().trim();
                const rcMatch = rcEl.match(/([\d,]+)/);
                const review_count = rcMatch ? parseInt(rcMatch[1].replace(/,/g, '')) : 0;

                let category = '';
                const breadcrumbs = $('a._2whKao, a.R0cyWM, div._1MR4o5 a');
                breadcrumbs.each((j, bc) => {
                    const t = $(bc).text().trim();
                    if (t && t !== 'Home' && !t.includes('flipkart') && t.length > 1) category = t;
                });

                let productLink = '';
                const linkEl = $(el).find('a[href*="/p/"]').first();
                if (linkEl.length) {
                    productLink = linkEl.attr('href');
                    if (productLink && !productLink.startsWith('http')) {
                        productLink = 'https://www.flipkart.com' + productLink;
                    }
                }

                if (name && (price > 0 || imageUrl)) {
                    products.push({
                        name, image_url: imageUrl, price, original_price,
                        rating, review_count,
                        category: category || 'General',
                        description: name,
                        brand: name.split(/\s+/)[0] || '',
                        product_url: productLink
                    });
                }
            });
            if (products.length > 0) break;
        }
        return products;
    }

    // Attempt 1: Axios
    try {
        const { data: html } = await axios.get(resolvedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000, maxRedirects: 10
        });
        const $ = cheerio.load(html);
        const products = extractCategoryProducts($);
        if (products.length > 0) {
            return res.json({ success: true, products, count: products.length });
        }
    } catch (e) {
        console.log('Category axios fetch failed:', e.message);
    }

    // Attempt 2: Puppeteer
    let browser = null;
    try {
        const puppeteer = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(StealthPlugin());
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.goto(resolvedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        // Scroll down to load more products
        await page.evaluate(() => window.scrollBy(0, 2000));
        await new Promise(r => setTimeout(r, 1500));
        const html = await page.content();
        const $ = cheerio.load(html);
        const products = extractCategoryProducts($);
        if (products.length > 0) {
            return res.json({ success: true, products, count: products.length });
        }
        res.status(404).json({ success: false, error: 'No products found on this page. Try a different category URL.' });
    } catch (error) {
        console.error('Category puppeteer error:', error.message);
        res.status(500).json({ success: false, error: 'Could not fetch category. Try again later.' });
    } finally {
        if (browser) await browser.close();
    }
});

// POST /api/shop/bulk-add — add multiple products at once
router.post('/bulk-add', requireAuth, (req, res) => {
    const { tgId } = req.session.user;
    const shop = db.prepare('SELECT * FROM shops WHERE tg_id = ?').get(tgId);
    if (!shop) return res.status(404).json({ error: 'No shop found.' });

    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'products array required.' });
    }

    const insert = db.prepare(
        'INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    );

    const added = [];
    const insertMany = db.transaction((items) => {
        for (const p of items) {
            if (!p.name || !p.image_url) continue;
            const price = parseInt(p.price) || 0;
            const op = parseInt(p.original_price) || price;
            const discount = op > 0 ? Math.max(0, Math.round(((op - price) / op) * 100)) : 0;
            const reviewsEnvelope = {
                reviews: p.reviews || [],
                images: p.images || [],
                highlights: p.highlights || [],
                specifications: p.specifications || [],
                ratings_breakdown: p.ratings_breakdown || {},
                brand: p.brand || '',
                sizes: p.sizes || [],
                colors: p.colors || p.color_variants || [],
                color_variants: p.color_variants || p.colors || [],
                video_url: p.video_url || '',
                a_plus_images: p.a_plus_images || [],
            };
            const result = insert.run(
                shop.id, p.name, p.category || 'General', p.image_url,
                price, op, discount, p.description || p.name,
                parseFloat(p.rating) || 4.0, parseInt(p.review_count) || 0,
                JSON.stringify(reviewsEnvelope)
            );
            added.push({ id: result.lastInsertRowid, name: p.name });
        }
    });

    try {
        insertMany(products.slice(0, 50)); // Max 50 at a time
        res.json({ success: true, added, count: added.length });
    } catch (err) {
        console.error('Bulk add error:', err);
        res.status(500).json({ error: 'Failed to add products.' });
    }
});

module.exports = router;

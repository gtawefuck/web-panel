const db = require('./db');
const crypto = require('crypto');

// Helper: build a Flipkart product image URL at a given size from the SKU image hash.
const fkImg = (path, size = 832) =>
    `https://rukminim2.flixcart.com/image/${size}/${size}/xif0q/mobile/${path}?q=90&crop=false`;

// 12 real Flipkart phones — sourced from the product page that resolves from
// https://dl.flipkart.com/s/diO7AkuuuN (MOTOROLA g57 power 5G is the headline product).
// Each entry packs structured `extras` (highlights/images/specs/ratings_breakdown) into
// the `reviews` column as JSON so we don't need a schema migration.
const PRODUCTS = [
    {
        name: 'MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)',
        brand: 'MOTOROLA',
        category: 'Mobiles',
        image_url: fkImg('1/k/r/-original-imahhqjwsngwkksu.jpeg'),
        price: 15999, original_price: 17999, discount: 11,
        description: 'Designed in collaboration with Pantone, the MOTOROLA g57 power 5G packs a massive 7000 mAh battery, a 50MP + 8MP rear camera and a smooth 6.72-inch LCD display. Powered by the Snapdragon 6s Gen 4, it delivers a snappy day-to-day experience while a 1-year handset warranty keeps you covered.',
        rating: 4.4, review_count: 43159,
        extras: {
            highlights: [
                '8 GB RAM | 128 GB ROM',
                'Snapdragon 6s Gen 4 | Octa Core Processor | 2.4 GHz Clock Speed',
                '50MP + 8MP Rear Camera | 8MP Front Camera',
                '6.72 inch LCD Display',
                '7000 mAh Lithium Polymer Battery',
                'IP64 Splash, Water and Dust Resistant',
                '1 Year Warranty on Handset and 6 Months on In-box Accessories'
            ],
            images: [
                fkImg('1/k/r/-original-imahhqjwsngwkksu.jpeg'),
                fkImg('h/h/m/-original-imahhqjwcywsynaq.jpeg'),
                fkImg('c/p/g/-original-imahhqjwmbxydvyy.jpeg'),
                fkImg('y/l/v/-original-imahhqjwgz7shhcx.jpeg'),
                fkImg('9/g/g/-original-imahhqjwef9h47wg.jpeg'),
                fkImg('5/u/v/-original-imahhqjw3anwcdza.jpeg'),
                fkImg('e/r/w/-original-imahhqjwav7hwyz6.jpeg'),
                fkImg('q/f/x/-original-imahhqjwhhwkfq5k.jpeg')
            ],
            color_variants: ['Pantone Fluidity', 'Pantone Corsair', 'Pantone Regatta'],
            ratings_breakdown: { '5': 27988, '4': 9959, '3': 2357, '2': 854, '1': 2001 },
            specifications: [
                { group: 'In The Box', items: [
                    { label: 'Sales Package', value: 'Phone, USB Type C Cable, SIM Tray Ejector, Adhesive Foam, Soft Cover, Quick Start Guide' },
                    { label: 'Model Number', value: 'XT2511-2' },
                    { label: 'Model Name', value: 'g57 power 5G' },
                    { label: 'Color', value: 'Pantone Fluidity' },
                    { label: 'Browse Type', value: 'Smartphones' },
                    { label: 'SIM Type', value: 'Dual Sim' },
                    { label: 'Hybrid Sim Slot', value: 'No' },
                    { label: 'Touchscreen', value: 'Yes' }
                ]},
                { group: 'Display Features', items: [
                    { label: 'Display Size', value: '17.07 cm (6.72 inch)' },
                    { label: 'Resolution', value: '2400 x 1080 Pixels' },
                    { label: 'Resolution Type', value: 'Full HD+' },
                    { label: 'GPU', value: 'Adreno 619' },
                    { label: 'Display Type', value: 'LCD with 120Hz Refresh Rate' },
                    { label: 'Other Display Features', value: 'Pantone Validated, 1.5K, 1B Colors, 100% DCI-P3, Peak Brightness 1050 nits' }
                ]},
                { group: 'OS & Processor Features', items: [
                    { label: 'Operating System', value: 'Android 15' },
                    { label: 'Processor Brand', value: 'Qualcomm' },
                    { label: 'Processor Type', value: 'Snapdragon 6s Gen 4' },
                    { label: 'Processor Core', value: 'Octa Core' },
                    { label: 'Primary Clock Speed', value: '2.4 GHz' }
                ]},
                { group: 'Memory & Storage Features', items: [
                    { label: 'Internal Storage', value: '128 GB' },
                    { label: 'RAM', value: '8 GB' },
                    { label: 'Total Memory', value: '128 GB' },
                    { label: 'Memory Card Slot Type', value: 'Dedicated Slot' },
                    { label: 'Expandable Storage', value: 'Up to 1 TB' }
                ]},
                { group: 'Camera Features', items: [
                    { label: 'Primary Camera Available', value: 'Yes' },
                    { label: 'Primary Camera', value: '50MP + 8MP' },
                    { label: 'Primary Camera Features', value: 'PDAF, OIS, Ultra-wide' },
                    { label: 'Secondary Camera Available', value: 'Yes' },
                    { label: 'Secondary Camera', value: '8MP Front Camera' },
                    { label: 'Video Recording', value: '1080p @ 30fps' },
                    { label: 'Flash', value: 'LED Flash' }
                ]},
                { group: 'Connectivity Features', items: [
                    { label: 'Network Type', value: '5G, 4G VOLTE, 4G LTE, 3G, 2G' },
                    { label: 'Internet Connectivity', value: '5G, 4G LTE, Wi-Fi 6 (802.11 a/b/g/n/ac/ax)' },
                    { label: 'Bluetooth Support', value: 'Yes' },
                    { label: 'Bluetooth Version', value: 'v5.2' },
                    { label: 'Wi-Fi', value: 'Yes' },
                    { label: 'NFC', value: 'No' },
                    { label: 'USB Connectivity', value: 'Type-C' }
                ]},
                { group: 'Battery & Power Features', items: [
                    { label: 'Battery Capacity', value: '7000 mAh' },
                    { label: 'Battery Type', value: 'Lithium Polymer' },
                    { label: 'Quick Charging', value: 'Yes, TurboPower 30W' }
                ]},
                { group: 'Dimensions', items: [
                    { label: 'Width', value: '76.4 mm' },
                    { label: 'Height', value: '167.4 mm' },
                    { label: 'Depth', value: '8.7 mm' },
                    { label: 'Weight', value: '215 g' }
                ]},
                { group: 'Warranty', items: [
                    { label: 'Warranty Summary', value: '1 Year Warranty on Handset and 6 Months Warranty on In-box Accessories' },
                    { label: 'Domestic Warranty', value: '1 Year' }
                ]}
            ],
            reviews: [
                { rating: 5, title: 'Mind-blowing purchase', text: 'Very Good product', user: 'Vijay Singh', city: 'Bilaspur', date: '4 months ago', helpful: 546, unhelpful: 167, verified: true },
                { rating: 5, title: 'Simply awesome',         text: 'I said full review use after 1 month. This mobile I use normal not heavy use — like secondary mobile, job person, house wife etc. Performance: very good processor handles every app smoothly. Camera is impressive especially in daylight.', user: 'Parth Unadkat', city: 'Navsari', date: '2 months ago', helpful: 20, unhelpful: 2, verified: true },
                { rating: 5, title: 'Just wow!',              text: 'Camera more than expected. Battery 🔋 powerful. Performance ek no. Design best hai. Sound quality top notch 😁 Display good 👍', user: 'arvind chaudhary', city: 'Gorakhpur', date: '4 months ago', helpful: 593, unhelpful: 196, verified: true },
                { rating: 5, title: 'Brilliant',              text: 'Camera quality super, phone working very smooth, battery backup good, fast delivery, all over experience fine. Thanks Moto.', user: 'Subhash Thaware', city: 'Kondhali', date: '4 months ago', helpful: 381, unhelpful: 121, verified: true },
                { rating: 4, title: 'Pretty good',            text: 'Seems ok... let\u2019s see how it performs. As of now everything is fine. Got it today.', user: 'Flipkart Customer', city: 'Jaipur', date: '4 months ago', helpful: 258, unhelpful: 85, verified: true },
                { rating: 5, title: 'Just wow!',              text: 'Nice mobile, great work MOTO.', user: 'Anup Dey', city: 'Dimapur', date: '4 months ago', helpful: 194, unhelpful: 58, verified: true },
                { rating: 4, title: 'Pretty good',            text: 'In one word this phone is just wooooowwww. Complete package under 16k — Battery 5/5, 7000 mAh gives 2 days backup with heavy to moderate use. Display 4/5, IPS LCD with vibrant true color. Performance 5/5.', user: 'Amit Tripathi', city: 'Ujjain', date: '4 months ago', helpful: 123, unhelpful: 37, verified: true },
                { rating: 5, title: 'Worth every penny',      text: 'Good product.', user: 'krishnendu Dey', city: 'Panchla', date: '4 months ago', helpful: 138, unhelpful: 41, verified: true },
                { rating: 4, title: 'Good quality product',   text: 'This phone is good but doesn\u2019t have a default album/gallery — you have to download an external app from the Play Store which has too many ads and ruins the experience.', user: 'Somu Prasad', city: 'New Delhi', date: '4 months ago', helpful: 220, unhelpful: 78, verified: true },
                { rating: 4, title: 'Nice product',           text: 'This is a good mobile but the battery is not as I expected from 7000 mAh.', user: 'Shoaib Raza', city: 'Azamgarh', date: '4 months ago', helpful: 109, unhelpful: 36, verified: true }
            ]
        }
    },
    {
        name: 'Samsung Galaxy S25 Plus 5G (Navy, 256 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=832&q=90',
        price: 67990, original_price: 99999, discount: 32,
        description: 'Samsung Galaxy S25 Plus 5G with Galaxy AI, a stunning 6.7-inch Dynamic AMOLED 2X display, Snapdragon 8 Elite for Galaxy and an advanced 50MP triple-lens camera system. Comes with 12GB RAM and 256GB storage.',
        rating: 4.5, review_count: 18421,
        extras: {
            highlights: ['12 GB RAM | 256 GB ROM','Snapdragon 8 Elite for Galaxy','50MP + 12MP + 10MP Triple Camera | 12MP Front Camera','6.7 inch QHD+ Dynamic AMOLED 2X 120Hz','4900 mAh Battery | 45W Fast Charging','Galaxy AI · Now Brief · Circle to Search'],
            color_variants: ['Navy','Silver Shadow','Mint','Pink Gold'],
            specifications: [
                { group: 'General', items: [{label:'Brand',value:'SAMSUNG'},{label:'Model',value:'Galaxy S25+'},{label:'Color',value:'Navy'},{label:'SIM Type',value:'Dual SIM'}] },
                { group: 'Display', items: [{label:'Display Size',value:'17.02 cm (6.7 inch)'},{label:'Resolution',value:'3120 x 1440 (QHD+)'},{label:'Display Type',value:'Dynamic AMOLED 2X 120Hz'}] },
                { group: 'OS & Processor', items: [{label:'Operating System',value:'Android 15, One UI 7'},{label:'Processor',value:'Snapdragon 8 Elite for Galaxy'}] },
                { group: 'Memory', items: [{label:'RAM',value:'12 GB'},{label:'Internal Storage',value:'256 GB'}] },
                { group: 'Camera', items: [{label:'Rear Camera',value:'50MP + 12MP UW + 10MP Tele'},{label:'Front Camera',value:'12MP'}] },
                { group: 'Battery', items: [{label:'Battery Capacity',value:'4900 mAh'},{label:'Fast Charging',value:'45W Wired, 15W Wireless'}] },
                { group: 'Warranty', items: [{label:'Warranty Summary',value:'1 Year Manufacturer Warranty'}] }
            ]
        }
    },
    {
        name: 'Samsung Galaxy S25 5G (Silver Shadow, 256 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=832&q=90',
        price: 62999, original_price: 80999, discount: 22,
        description: 'Samsung Galaxy S25 5G — compact 6.2-inch flagship with Galaxy AI, Snapdragon 8 Elite for Galaxy and 50MP main camera. Perfect for one-handed use with all-day battery.',
        rating: 4.5, review_count: 11267,
        extras: {
            highlights: ['12 GB RAM | 256 GB ROM','Snapdragon 8 Elite for Galaxy','50MP + 12MP + 10MP Triple Camera | 12MP Front Camera','6.2 inch FHD+ Dynamic AMOLED 2X 120Hz','4000 mAh Battery | 25W Fast Charging','Galaxy AI · Now Brief'],
            color_variants: ['Silver Shadow','Navy','Mint'],
            specifications: [
                { group: 'General', items: [{label:'Brand',value:'SAMSUNG'},{label:'Model',value:'Galaxy S25'},{label:'Color',value:'Silver Shadow'}] },
                { group: 'Display', items: [{label:'Display Size',value:'15.75 cm (6.2 inch)'},{label:'Display Type',value:'Dynamic AMOLED 2X 120Hz'}] },
                { group: 'Memory', items: [{label:'RAM',value:'12 GB'},{label:'Internal Storage',value:'256 GB'}] },
                { group: 'Battery', items: [{label:'Battery Capacity',value:'4000 mAh'}] },
                { group: 'Warranty', items: [{label:'Warranty Summary',value:'1 Year Manufacturer Warranty'}] }
            ]
        }
    },
    {
        name: 'Samsung Galaxy S25 FE 5G (Jetblack, 128 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=832&q=90',
        price: 44999, original_price: 59999, discount: 25,
        description: 'Samsung Galaxy S25 FE 5G — Fan Edition flagship with Galaxy AI, 6.7-inch Dynamic AMOLED display and a 50MP triple camera system. 8 GB RAM, 128 GB storage and 4900 mAh battery.',
        rating: 4.5, review_count: 7634,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','Exynos 2400e','50MP + 8MP UW + 12MP Tele Triple Camera','12MP Front Camera','6.7 inch FHD+ Super AMOLED 120Hz','4900 mAh Battery'],
            color_variants: ['Jetblack','Icyblue','Navy','White']
        }
    },
    {
        name: 'Samsung Galaxy F70e 5G (Spotlight Blue, 128 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=832&q=90',
        price: 13999, original_price: 18999, discount: 26,
        description: 'Samsung Galaxy F70e 5G with 6 GB RAM, MediaTek Dimensity 7300, 50MP AI camera and 5000 mAh battery. A solid 5G performer for the price.',
        rating: 4.3, review_count: 9182,
        extras: {
            highlights: ['6 GB RAM | 128 GB ROM','MediaTek Dimensity 7300','50MP + 2MP Rear Camera | 13MP Front Camera','6.7 inch FHD+ Super AMOLED 120Hz','5000 mAh Battery | 25W Fast Charging','Knox Vault Security'],
            color_variants: ['Spotlight Blue','Limelight Green']
        }
    },
    {
        name: 'Samsung Galaxy F70e 5G (Limelight Green, 128 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=832&q=90',
        price: 12499, original_price: 16999, discount: 26,
        description: 'Samsung Galaxy F70e 5G in Limelight Green — 4 GB RAM variant with MediaTek Dimensity 7300, 50MP camera and 5000 mAh battery.',
        rating: 4.2, review_count: 6418,
        extras: {
            highlights: ['4 GB RAM | 128 GB ROM','MediaTek Dimensity 7300','50MP + 2MP Rear Camera | 13MP Front Camera','6.7 inch FHD+ Super AMOLED 120Hz','5000 mAh Battery | 25W Fast Charging'],
            color_variants: ['Limelight Green','Spotlight Blue']
        }
    },
    {
        name: 'vivo X200T 5G (Seaside Lilac, 256 GB)',
        brand: 'VIVO', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=832&q=90',
        price: 59999, original_price: 79999, discount: 25,
        description: 'vivo X200T 5G — flagship-class camera phone with 50MP ZEISS triple optics, 6.78-inch AMOLED display and 5500 mAh battery powered by Dimensity 9400.',
        rating: 4.6, review_count: 12345,
        extras: {
            highlights: ['12 GB RAM | 256 GB ROM','MediaTek Dimensity 9400','50MP ZEISS Triple Camera | 32MP Front','6.78 inch FHD+ AMOLED 120Hz','5500 mAh Battery | 90W FlashCharge','IP68 / IP69 Rated'],
            color_variants: ['Seaside Lilac','Stellar Black']
        }
    },
    {
        name: 'vivo T5 Pro 5G (Glacier Blue, 128 GB)',
        brand: 'VIVO', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=832&q=90',
        price: 29999, original_price: 55999, discount: 46,
        description: 'vivo T5 Pro 5G — premium mid-range with curved AMOLED display, 50MP Sony LYT camera and 6500 mAh battery.',
        rating: 4.6, review_count: 9842,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','MediaTek Dimensity 7300 Energy','50MP Sony LYT-600 OIS | 32MP Front','6.77 inch FHD+ Curved AMOLED 120Hz','6500 mAh Battery | 90W FlashCharge'],
            color_variants: ['Glacier Blue','Lush Green']
        }
    },
    {
        name: 'vivo T5x 5G (Cyber Green, 128 GB)',
        brand: 'VIVO', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1611077542243-37cf08bbed30?w=832&q=90',
        price: 22999, original_price: 28999, discount: 21,
        description: 'vivo T5x 5G with 6500 mAh massive battery, 50MP AI camera and 6.74-inch 120Hz display. Built for long-haul performance.',
        rating: 4.5, review_count: 14721,
        extras: {
            highlights: ['6 GB RAM | 128 GB ROM','MediaTek Dimensity 6300','50MP AI Rear Camera | 8MP Front','6.74 inch HD+ 120Hz Display','6500 mAh Battery | 44W FlashCharge'],
            color_variants: ['Cyber Green','Phantom Grey']
        }
    },
    {
        name: 'realme P4 Power 5G (TransSilver, 128 GB)',
        brand: 'REALME', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=832&q=90&hue=200',
        price: 25999, original_price: 32999, discount: 21,
        description: 'realme P4 Power 5G — performance-focused mid-ranger with Snapdragon 7s Gen 4, 7000 mAh battery and 120Hz AMOLED display.',
        rating: 4.5, review_count: 8931,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','Snapdragon 7s Gen 4','50MP + 8MP Rear Camera | 16MP Front','6.78 inch FHD+ AMOLED 120Hz','7000 mAh Battery | 80W SuperVOOC'],
            color_variants: ['TransSilver','Lightning Black']
        }
    },
    {
        name: 'realme P4x 5G (Matte Silver, 128 GB)',
        brand: 'REALME', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1601972602288-3be527b4f18d?w=832&q=90',
        price: 16913, original_price: 21999, discount: 23,
        description: 'realme P4x 5G — budget 5G with 6 GB RAM, MediaTek Dimensity 6400, 50MP AI camera and 6000 mAh battery.',
        rating: 4.4, review_count: 11203,
        extras: {
            highlights: ['6 GB RAM | 128 GB ROM','MediaTek Dimensity 6400','50MP AI Rear Camera | 8MP Front','6.74 inch HD+ 120Hz Display','6000 mAh Battery | 45W SuperVOOC'],
            color_variants: ['Matte Silver','Matte Blue']
        }
    },
    {
        name: 'OPPO K14 5G (Prism Violet, 128 GB)',
        brand: 'OPPO', category: 'Mobiles',
        image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=832&q=90&sat=-20',
        price: 19999, original_price: 25999, discount: 23,
        description: 'OPPO K14 5G with Snapdragon 6 Gen 1, 50MP AI camera and 7000 mAh battery — built tough with IP65 protection.',
        rating: 4.3, review_count: 5742,
        extras: {
            highlights: ['6 GB RAM | 128 GB ROM','Snapdragon 6 Gen 1','50MP + 2MP Rear Camera | 8MP Front','6.67 inch FHD+ AMOLED 120Hz','7000 mAh Battery | 80W SuperVOOC','IP65 Dust & Water Resistant'],
            color_variants: ['Prism Violet','Glacier Blue']
        }
    }
];

function generateSlug(tgId) {
    return 'shop-' + crypto.createHash('md5').update(String(tgId)).digest('hex').slice(0, 8);
}

function buildReviewsField(p) {
    // The DB column `reviews` is reused as a JSON envelope for the rich PDP data
    // (reviews + highlights + specs + images + ratings_breakdown + brand + color_variants).
    const e = p.extras || {};
    return JSON.stringify({
        reviews: e.reviews || [],
        highlights: e.highlights || (p.description ? p.description.split('|').map(s => s.trim()) : []),
        images: e.images || [p.image_url],
        specifications: e.specifications || [],
        ratings_breakdown: e.ratings_breakdown || null,
        brand: p.brand || '',
        color_variants: e.color_variants || []
    });
}

function createShopForUser(tgId) {
    const existing = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(tgId);
    if (existing) return existing.slug;
    const slug = generateSlug(tgId);
    db.prepare('INSERT OR IGNORE INTO shops (tg_id, slug) VALUES (?, ?)').run(String(tgId), slug);
    const shop = db.prepare('SELECT id FROM shops WHERE tg_id = ?').get(String(tgId));
    const insert = db.prepare('INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const p of PRODUCTS) {
        insert.run(shop.id, p.name, p.category, p.image_url, p.price, p.original_price, p.discount, p.description, p.rating, p.review_count, buildReviewsField(p));
    }
    return slug;
}

function reseedShop(slug) {
    const shop = db.prepare('SELECT id FROM shops WHERE slug = ?').get(slug);
    if (!shop) return false;
    db.prepare('DELETE FROM products WHERE shop_id = ?').run(shop.id);
    const insert = db.prepare('INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const p of PRODUCTS) {
        insert.run(shop.id, p.name, p.category, p.image_url, p.price, p.original_price, p.discount, p.description, p.rating, p.review_count, buildReviewsField(p));
    }
    return true;
}

module.exports = { createShopForUser, generateSlug, reseedShop, PRODUCTS, buildReviewsField };

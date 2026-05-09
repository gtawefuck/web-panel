const db = require('./db');
const crypto = require('crypto');

// Helper: build a Flipkart product image URL at a given size from the SKU image hash.
const fkImg = (path, size = 832) =>
    `https://rukminim2.flixcart.com/image/${size}/${size}/xif0q/mobile/${path}?q=90&crop=false`;

// Two real Flipkart products copied verbatim from flipkart.com PDPs:
//   1) MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)  — the link the user shared
//      https://dl.flipkart.com/s/diO7AkuuuN
//   2) SAMSUNG Galaxy S25 5G (Navy, 256 GB)
//      https://www.flipkart.com/samsung-galaxy-s25-5g-navy-256-gb/p/itm277a7d1824e44
// Each entry packs structured `extras` (highlights/images/specs/ratings_breakdown/reviews)
// into the `reviews` JSON column so we don't need a schema migration.
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
                { rating: 5, title: 'Simply awesome',         text: 'I said full review use after 1 month. This mobile I use normal not heavy use \u2014 like secondary mobile, job person, house wife etc. Performance: very good processor handles every app smoothly. Camera is impressive especially in daylight.', user: 'Parth Unadkat', city: 'Navsari', date: '2 months ago', helpful: 20, unhelpful: 2, verified: true },
                { rating: 5, title: 'Just wow!',              text: 'Camera more than expected. Battery \uD83D\uDD0B powerful. Performance ek no. Design best hai. Sound quality top notch \uD83D\uDE01 Display good \uD83D\uDC4D', user: 'arvind chaudhary', city: 'Gorakhpur', date: '4 months ago', helpful: 593, unhelpful: 196, verified: true },
                { rating: 5, title: 'Brilliant',              text: 'Camera quality super, phone working very smooth, battery backup good, fast delivery, all over experience fine. Thanks Moto.', user: 'Subhash Thaware', city: 'Kondhali', date: '4 months ago', helpful: 381, unhelpful: 121, verified: true },
                { rating: 4, title: 'Pretty good',            text: 'Seems ok... let\u2019s see how it performs. As of now everything is fine. Got it today.', user: 'Flipkart Customer', city: 'Jaipur', date: '4 months ago', helpful: 258, unhelpful: 85, verified: true },
                { rating: 5, title: 'Just wow!',              text: 'Nice mobile, great work MOTO.', user: 'Anup Dey', city: 'Dimapur', date: '4 months ago', helpful: 194, unhelpful: 58, verified: true },
                { rating: 4, title: 'Pretty good',            text: 'In one word this phone is just wooooowwww. Complete package under 16k \u2014 Battery 5/5, 7000 mAh gives 2 days backup with heavy to moderate use. Display 4/5, IPS LCD with vibrant true color. Performance 5/5.', user: 'Amit Tripathi', city: 'Ujjain', date: '4 months ago', helpful: 123, unhelpful: 37, verified: true },
                { rating: 5, title: 'Worth every penny',      text: 'Good product.', user: 'krishnendu Dey', city: 'Panchla', date: '4 months ago', helpful: 138, unhelpful: 41, verified: true },
                { rating: 4, title: 'Good quality product',   text: 'This phone is good but doesn\u2019t have a default album/gallery \u2014 you have to download an external app from the Play Store which has too many ads and ruins the experience.', user: 'Somu Prasad', city: 'New Delhi', date: '4 months ago', helpful: 220, unhelpful: 78, verified: true },
                { rating: 4, title: 'Nice product',           text: 'This is a good mobile but the battery is not as I expected from 7000 mAh.', user: 'Shoaib Raza', city: 'Azamgarh', date: '4 months ago', helpful: 109, unhelpful: 36, verified: true }
            ]
        }
    },
    {
        name: 'SAMSUNG Galaxy S25 5G (Navy, 256 GB)',
        brand: 'SAMSUNG',
        category: 'Mobiles',
        image_url: fkImg('j/e/r/-original-imah8pdgedd5whgs.jpeg'),
        price: 62999, original_price: 80999, discount: 22,
        description: 'SAMSUNG Galaxy S25 5G \u2014 a compact 6.2-inch flagship powered by Galaxy AI and the Snapdragon 8 Elite for Galaxy. 50MP + 10MP + 12MP triple rear camera, 12MP front camera and a 4000 mAh battery on a Dynamic AMOLED 2X display. Comes with 12 GB RAM and 256 GB storage in a premium Navy finish.',
        rating: 4.6, review_count: 2889,
        extras: {
            highlights: [
                '12 GB RAM | 256 GB ROM',
                '8 Elite for Galaxy | Octa Core Processor | 4.47 GHz Clock Speed',
                '50MP + 10MP + 12MP Rear Camera',
                '12MP Front Camera',
                '6.2 inch Dynamic AMOLED 2X Display',
                '4000 mAh Battery',
                '1 Year Manufacturer Warranty for Device and 6 Months for In-Box Accessories'
            ],
            images: [
                fkImg('j/e/r/-original-imah8pdgedd5whgs.jpeg'),
                fkImg('2/b/8/-original-imah8pdgvxdznyes.jpeg'),
                fkImg('c/4/o/-original-imah8pdgzr3tqyhm.jpeg'),
                fkImg('u/l/v/-original-imah8pdgpjgyzhpx.jpeg'),
                fkImg('m/p/s/-original-imah8pdgc6vduxqv.jpeg'),
                fkImg('v/7/a/-original-imah8pdgzhyfdveh.jpeg')
            ],
            color_variants: ['Navy', 'Silver Shadow', 'Mint', 'Icyblue'],
            ratings_breakdown: { '5': 1878, '4': 664, '3': 202, '2': 87, '1': 58 },
            specifications: [
                { group: 'In The Box', items: [
                    { label: 'Sales Package', value: 'Phone, USB Cable Type C-to-C, Quick Start Guide, SIM Ejector Pin' },
                    { label: 'Model Number', value: 'SM-S931BDBH' },
                    { label: 'Model Name', value: 'Galaxy S25' },
                    { label: 'Color', value: 'Navy' },
                    { label: 'Browse Type', value: 'Smartphones' },
                    { label: 'SIM Type', value: 'Dual Sim (Nano + eSIM)' },
                    { label: 'Touchscreen', value: 'Yes' },
                    { label: 'OTG Compatible', value: 'Yes' }
                ]},
                { group: 'Display Features', items: [
                    { label: 'Display Size', value: '15.75 cm (6.2 inch)' },
                    { label: 'Resolution', value: '2340 x 1080 Pixels' },
                    { label: 'Resolution Type', value: 'Full HD+' },
                    { label: 'Display Type', value: 'Dynamic AMOLED 2X' },
                    { label: 'Other Display Features', value: '120Hz Adaptive Refresh Rate, Vision Booster, 2600 nits Peak Brightness, Corning Gorilla Glass Victus 2' }
                ]},
                { group: 'OS & Processor Features', items: [
                    { label: 'Operating System', value: 'Android 15, One UI 7' },
                    { label: 'Processor Brand', value: 'Qualcomm' },
                    { label: 'Processor Type', value: 'Snapdragon 8 Elite for Galaxy' },
                    { label: 'Processor Core', value: 'Octa Core' },
                    { label: 'Primary Clock Speed', value: '4.47 GHz' }
                ]},
                { group: 'Memory & Storage Features', items: [
                    { label: 'Internal Storage', value: '256 GB' },
                    { label: 'RAM', value: '12 GB' },
                    { label: 'Memory Card Slot Type', value: 'No' },
                    { label: 'Expandable Storage', value: 'Not Supported' }
                ]},
                { group: 'Camera Features', items: [
                    { label: 'Primary Camera Available', value: 'Yes' },
                    { label: 'Primary Camera', value: '50MP + 10MP + 12MP' },
                    { label: 'Primary Camera Features', value: 'OIS, 3x Optical Zoom, 30x Space Zoom, Auto HDR, Night Mode, Pro Mode' },
                    { label: 'Secondary Camera Available', value: 'Yes' },
                    { label: 'Secondary Camera', value: '12MP Front Camera' },
                    { label: 'Video Recording', value: '8K @ 30fps, 4K @ 60fps' },
                    { label: 'Flash', value: 'LED Flash' }
                ]},
                { group: 'Connectivity Features', items: [
                    { label: 'Network Type', value: '5G, 4G VOLTE, 4G LTE, 3G, 2G' },
                    { label: 'Internet Connectivity', value: '5G, 4G LTE, Wi-Fi 7' },
                    { label: 'Bluetooth Support', value: 'Yes' },
                    { label: 'Bluetooth Version', value: 'v5.4' },
                    { label: 'Wi-Fi', value: 'Yes' },
                    { label: 'NFC', value: 'Yes' },
                    { label: 'USB Connectivity', value: 'Type-C, USB 3.2' }
                ]},
                { group: 'Battery & Power Features', items: [
                    { label: 'Battery Capacity', value: '4000 mAh' },
                    { label: 'Battery Type', value: 'Lithium-ion' },
                    { label: 'Quick Charging', value: 'Yes, 25W Wired Fast Charging, 15W Wireless' }
                ]},
                { group: 'Dimensions', items: [
                    { label: 'Width', value: '70.5 mm' },
                    { label: 'Height', value: '146.9 mm' },
                    { label: 'Depth', value: '7.2 mm' },
                    { label: 'Weight', value: '162 g' }
                ]},
                { group: 'Warranty', items: [
                    { label: 'Warranty Summary', value: '1 Year Manufacturer Warranty for Device and 6 Months for In-Box Accessories' },
                    { label: 'Domestic Warranty', value: '1 Year' }
                ]}
            ],
            reviews: [
                { rating: 5, title: 'Brilliant',           text: 'Amazing Camera, performance and software optimisation. Full Power flagship experience in a compact 6.2 inch body. Battery lasts a full day with normal use. Galaxy AI features like Now Brief and Circle to Search are genuinely useful.', user: 'frontech ecam', city: 'Hyderabad', date: '1 year ago', helpful: 858, unhelpful: 256, verified: true },
                { rating: 5, title: 'Highly recommended', text: 'Beyond Expectation. Top notch performance. No heating issue. Battery backup is amazing. Camera quality is superb in all light conditions. Display is bright and vivid.', user: 'Hari Krishnan', city: 'Chennai', date: '1 year ago', helpful: 612, unhelpful: 188, verified: true },
                { rating: 5, title: 'Must buy!',           text: 'Build quality is premium with the new Armor Aluminum frame. One UI 7 feels much smoother than before. The camera handles low light beautifully. Worth every rupee.', user: 'Deepak Kumar', city: 'Tirunelveli District', date: '5 months ago', helpful: 210, unhelpful: 47, verified: true },
                { rating: 4, title: 'Value-for-money',    text: 'Good phone, Camera is good, design and performance is also good. But taking everything in totality, price is little higher. Would have liked a slightly bigger battery.', user: 'Raju Pattanayak', city: 'Nashik', date: '1 year ago', helpful: 97, unhelpful: 34, verified: true },
                { rating: 5, title: 'Terrific',            text: 'Ordered on Nov 2025. Received Oct 2025 manufactured phone. So no issues and it\u2019s not a preactivated phone. Device warranty started from the date of purchase. Genuine product from Flipkart.', user: 'Dwaragadeesh R', city: 'Bangalore Division', date: '4 months ago', helpful: 69, unhelpful: 25, verified: true },
                { rating: 4, title: 'Good choice',         text: 'I wanted to experience something new. Upgraded from iPhone. Few notes: Camera is good but needs an OS update for further optimisation. Performance is just great. Display is sharp.', user: 'Shubham Raj', city: 'Purnia', date: '1 year ago', helpful: 217, unhelpful: 90, verified: true },
                { rating: 5, title: 'Just wow!',           text: 'This is the best phone i have ever purchased \uD83D\uDD25\uD83D\uDE0D', user: 'Pritam Mitra', city: 'Suri', date: '7 months ago', helpful: 55, unhelpful: 19, verified: true },
                { rating: 5, title: 'Super!',              text: 'Smooth performance, premium build, day-long battery. Galaxy AI features come in handy. Compact form factor is hard to find elsewhere with flagship hardware.', user: 'Arjun Sharma', city: 'New Delhi', date: '6 months ago', helpful: 84, unhelpful: 22, verified: true }
            ]
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

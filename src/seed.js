const crypto = require('crypto');
const db = require('./db');

const DEFAULT_PRODUCTS = [
    // Electronics
    {
        name: 'Samsung Galaxy S24 Ultra 5G',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
        price: 89999, original_price: 134999, discount: 33,
        description: '12GB RAM | 256GB Storage | 200MP Camera | 5000mAh Battery | S Pen Included | IP68 Water Resistant | Snapdragon 8 Gen 3',
        rating: 4.6, review_count: 12847,
        reviews: JSON.stringify([
            { user: 'Rahul M.', rating: 5, text: 'Absolutely stunning phone! Camera quality is unreal.', date: '2024-12-10' },
            { user: 'Priya S.', rating: 4, text: 'Best Android phone right now. Battery could be better.', date: '2024-11-28' },
            { user: 'Arun K.', rating: 5, text: 'Worth every penny. S Pen is so useful!', date: '2024-11-15' }
        ])
    },
    {
        name: 'Apple iPhone 15 Pro Max 256GB',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
        price: 134900, original_price: 159900, discount: 16,
        description: 'A17 Pro Chip | Titanium Design | 48MP Main Camera | USB-C | Action Button | ProRes Video Recording',
        rating: 4.7, review_count: 23541,
        reviews: JSON.stringify([
            { user: 'Neha R.', rating: 5, text: 'Titanium build feels incredibly premium.', date: '2024-12-05' },
            { user: 'Vikas T.', rating: 5, text: 'Best iPhone ever made. Cameras are insane.', date: '2024-11-22' },
            { user: 'Sonal P.', rating: 4, text: 'Great phone but very expensive.', date: '2024-11-10' }
        ])
    },
    {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
        price: 24990, original_price: 34990, discount: 29,
        description: 'Industry-Leading ANC | 30hr Battery | Hi-Res Audio | Multipoint Connection | Speak-to-Chat | Foldable Design',
        rating: 4.5, review_count: 8932,
        reviews: JSON.stringify([
            { user: 'Amit B.', rating: 5, text: 'ANC is absolutely godlike. No sound passes through!', date: '2024-12-01' },
            { user: 'Deepa L.', rating: 4, text: 'Comfortable for long hours. Sound quality is superb.', date: '2024-11-20' },
            { user: 'Rohit S.', rating: 5, text: 'Best headphones I have ever owned.', date: '2024-10-30' }
        ])
    },
    {
        name: 'LG 55-inch 4K OLED Smart TV',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&q=80',
        price: 79990, original_price: 129990, discount: 38,
        description: 'Self-Lit OLED | α9 Gen6 Processor | Dolby Vision IQ | AirPlay 2 | ThinQ AI | 120Hz Refresh Rate | HDMI 2.1',
        rating: 4.8, review_count: 5621,
        reviews: JSON.stringify([
            { user: 'Suresh N.', rating: 5, text: 'Picture quality will make your jaw drop. Pure blacks!', date: '2024-11-30' },
            { user: 'Meena V.', rating: 5, text: 'Streaming movies on this is a completely different experience.', date: '2024-11-18' },
            { user: 'Kartik J.', rating: 4, text: 'Excellent TV. WebOS is smooth and intuitive.', date: '2024-10-25' }
        ])
    },
    {
        name: 'MacBook Air 15" M3 Chip 8GB/256GB',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
        price: 114900, original_price: 134900, discount: 15,
        description: 'Apple M3 Chip | 15.3" Liquid Retina Display | 18hr Battery | MagSafe Charging | Midnight Color | Wi-Fi 6E',
        rating: 4.7, review_count: 9823,
        reviews: JSON.stringify([
            { user: 'Ananya R.', rating: 5, text: 'Insane battery life. Goes all day without charging!', date: '2024-12-08' },
            { user: 'Mukesh D.', rating: 5, text: 'M3 chip is blazing fast for everything.', date: '2024-11-25' },
            { user: 'Pooja T.', rating: 4, text: 'Beautiful machine. The display is gorgeous.', date: '2024-11-10' }
        ])
    },
    {
        name: 'Canon EOS R50 Mirrorless Camera Kit',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
        price: 64990, original_price: 89990, discount: 28,
        description: '24.2MP APS-C Sensor | 4K Video | Dual Pixel AF | Wi-Fi & Bluetooth | 15fps Burst | Vari-angle Touchscreen',
        rating: 4.4, review_count: 3241,
        reviews: JSON.stringify([
            { user: 'Varun K.', rating: 5, text: 'Perfect beginner mirrorless camera. AF is lightning fast!', date: '2024-11-28' },
            { user: 'Ritu M.', rating: 4, text: 'Great image quality, very compact and light.', date: '2024-11-12' },
            { user: 'Sanjay P.', rating: 4, text: 'Video quality is impressive. Battery life is ok.', date: '2024-10-20' }
        ])
    },
    {
        name: 'Bose SoundLink Max Portable Speaker',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
        price: 29900, original_price: 39900, discount: 25,
        description: '20hr Playtime | IP67 Waterproof | Stereoscopic Sound | PartyMode Up to 2 Speakers | USB-C Fast Charge',
        rating: 4.5, review_count: 4512,
        reviews: JSON.stringify([
            { user: 'Harish B.', rating: 5, text: 'Sound is massive for its size. Party mode is a game changer!', date: '2024-12-03' },
            { user: 'Nandini A.', rating: 4, text: 'Great build quality, IP67 is a plus for outdoor use.', date: '2024-11-17' },
            { user: 'Tarun G.', rating: 5, text: 'Best wireless speaker I have ever tried.', date: '2024-10-30' }
        ])
    },
    // Home Appliances
    {
        name: 'Dyson V15 Detect Absolute Cordless Vacuum',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
        price: 52900, original_price: 64900, discount: 18,
        description: 'Laser Dust Detection | HEPA Filtration | 60min Runtime | LCD Screen | Auto-Adjust Suction | 14 Accessories',
        rating: 4.6, review_count: 6732,
        reviews: JSON.stringify([
            { user: 'Swati R.', rating: 5, text: 'The laser detection is surprisingly useful! Picks up everything.', date: '2024-11-30' },
            { user: 'Manoj V.', rating: 5, text: 'Worth the premium price. House has never been this clean.', date: '2024-11-14' },
            { user: 'Kavya S.', rating: 4, text: 'Powerful suction. Dustbin is a bit small though.', date: '2024-10-22' }
        ])
    },
    {
        name: 'Samsung 253L Convertible 5-in-1 Refrigerator',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&q=80',
        price: 24990, original_price: 36990, discount: 32,
        description: '5-in-1 Convertible Modes | Digital Inverter | Anti-Bacterial | SpaceMax Technology | Twin Cooling | 3 Star Rating',
        rating: 4.3, review_count: 11234,
        reviews: JSON.stringify([
            { user: 'Lalitha P.', rating: 4, text: 'Convertible feature is very practical. Saves electricity!', date: '2024-12-01' },
            { user: 'Dinesh M.', rating: 4, text: 'Great value for money. Cooling is uniform throughout.', date: '2024-11-19' },
            { user: 'Usha K.', rating: 5, text: 'Very quiet and efficient. Happy with this purchase.', date: '2024-10-28' }
        ])
    },
    {
        name: 'LG 8Kg 5 Star Inverter Washing Machine',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1626806787461-102c1a7f1d67?w=400&q=80',
        price: 31490, original_price: 45990, discount: 32,
        description: 'AI Direct Drive | Steam Wash | ThinQ App Control | 5 Star BEE | 6 Motion Wash | Built-in WiFi | 10yr Motor Warranty',
        rating: 4.5, review_count: 8921,
        reviews: JSON.stringify([
            { user: 'Bhavna S.', rating: 5, text: 'ThinQ app control is brilliant. Can start wash from office!', date: '2024-11-28' },
            { user: 'Rajeev N.', rating: 4, text: 'Very quiet washer. Clothes come out super clean.', date: '2024-11-10' },
            { user: 'Sunita T.', rating: 5, text: 'Best purchase this year. Steam wash gets rid of all odors!', date: '2024-10-18' }
        ])
    },
    {
        name: 'Philips Air Fryer HD9252 4.1L',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
        price: 7995, original_price: 13995, discount: 43,
        description: 'RapidAir Technology | 90% Less Fat | Digital Display | 7 Presets | 4.1L Capacity | Dishwasher Safe Parts',
        rating: 4.4, review_count: 24512,
        reviews: JSON.stringify([
            { user: 'Asha M.', rating: 5, text: 'Changed how we cook at home. French fries are amazing!', date: '2024-12-10' },
            { user: 'Nitin B.', rating: 4, text: 'Great for healthy cooking. Easy to clean too.', date: '2024-11-24' },
            { user: 'Rekha G.', rating: 5, text: 'Using every single day. Chicken comes out perfectly crispy.', date: '2024-11-08' }
        ])
    },
    {
        name: 'Whirlpool 1.5 Ton 5 Star Split AC',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
        price: 34490, original_price: 52990, discount: 35,
        description: 'MAGICOOL Pro | 6th Sense FastCool | 5 Star BEE | PM 2.5 Filter | Auto Restart | Wi-Fi Enabled | R32 Gas',
        rating: 4.3, review_count: 7823,
        reviews: JSON.stringify([
            { user: 'Prakash V.', rating: 4, text: 'Cools very fast. WiFi control is very convenient.', date: '2024-11-30' },
            { user: 'Geetha R.', rating: 5, text: 'Very energy efficient. Electricity bills barely changed!', date: '2024-11-14' },
            { user: 'Kiran S.', rating: 4, text: 'Quiet and effective. Installation was smooth too.', date: '2024-10-25' }
        ])
    },
    {
        name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&q=80',
        price: 8999, original_price: 14999, discount: 40,
        description: '7 Appliances in 1 | Pressure Cooker | Slow Cooker | Rice Cooker | Steamer | Sauté Pan | 14 Smart Programs | 6L',
        rating: 4.5, review_count: 18234,
        reviews: JSON.stringify([
            { user: 'Preeti A.', rating: 5, text: 'Game changer for cooking! Dal in 15 minutes is incredible.', date: '2024-12-08' },
            { user: 'Ramesh C.', rating: 5, text: 'Best kitchen gadget ever bought. Using it daily.', date: '2024-11-22' },
            { user: 'Shobha N.', rating: 4, text: 'Excellent pressure cooker. Takes some learning but worth it.', date: '2024-11-05' }
        ])
    },
    // Fashion & Lifestyle
    {
        name: 'Titan Analog Watch Edge Collection',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        price: 7495, original_price: 12995, discount: 42,
        description: 'Ultra-Slim 5.8mm | Sapphire Glass | Stainless Steel Case | Genuine Leather Strap | 3ATM Water Resistant',
        rating: 4.4, review_count: 9823,
        reviews: JSON.stringify([
            { user: 'Vivek P.', rating: 5, text: 'Stunning watch! Gets so many compliments at work.', date: '2024-11-28' },
            { user: 'Anitha R.', rating: 4, text: 'Great quality for the price. Slim profile is very elegant.', date: '2024-11-12' },
            { user: 'Mohan L.', rating: 4, text: 'Perfect gifting option. Packaging is also premium.', date: '2024-10-20' }
        ])
    },
    {
        name: 'Ray-Ban Aviator Classic Sunglasses',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80',
        price: 8490, original_price: 13490, discount: 37,
        description: 'Crystal Green G-15 Lens | Gold Frame | UV400 Protection | Polarized | Metal Frame | Includes Case & Cloth',
        rating: 4.6, review_count: 15234,
        reviews: JSON.stringify([
            { user: 'Arjun M.', rating: 5, text: 'Timeless classic! These never go out of style.', date: '2024-12-04' },
            { user: 'Divya K.', rating: 5, text: 'Build quality is phenomenal. Lens clarity is top notch.', date: '2024-11-19' },
            { user: 'Suresh B.', rating: 4, text: 'Authentic product. Worth the price for sure.', date: '2024-10-28' }
        ])
    },
    // Sports & Fitness
    {
        name: 'Apple Watch Series 9 GPS 45mm',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80',
        price: 41900, original_price: 49990, discount: 16,
        description: 'S9 SiP Chip | Double Tap Gesture | Always-On Retina | ECG & Blood Oxygen | Crash Detection | 18hr Battery',
        rating: 4.7, review_count: 21023,
        reviews: JSON.stringify([
            { user: 'Tejal S.', rating: 5, text: 'Best smartwatch on the market, period!', date: '2024-12-09' },
            { user: 'Hari V.', rating: 5, text: 'Double Tap gesture is so handy. Health features are great.', date: '2024-11-23' },
            { user: 'Shruti P.', rating: 4, text: 'Excellent watch but battery life could be better.', date: '2024-11-11' }
        ])
    },
    {
        name: 'Nike Air Max 270 Running Shoes',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
        price: 8995, original_price: 14995, discount: 40,
        description: 'Max Air Unit | Mesh Upper | React Foam Midsole | Rubber Outsole | Available in 8 Colors | Sizes 6-12',
        rating: 4.4, review_count: 32012,
        reviews: JSON.stringify([
            { user: 'Rajan T.', rating: 5, text: 'Incredibly comfortable! Walk for hours without fatigue.', date: '2024-12-06' },
            { user: 'Priya N.', rating: 4, text: 'Great cushioning. Looks amazing too!', date: '2024-11-20' },
            { user: 'Aditya B.', rating: 4, text: 'Good quality, runs true to size.', date: '2024-10-30' }
        ])
    },
    {
        name: 'Whey Protein Gold Standard 5lb',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80',
        price: 5299, original_price: 8499, discount: 38,
        description: '24g Protein Per Serving | 5.5g BCAAs | Gluten Free | 74 Servings | Double Rich Chocolate | Lab Tested',
        rating: 4.5, review_count: 45123,
        reviews: JSON.stringify([
            { user: 'Kundan B.', rating: 5, text: 'Best tasting protein powder. Mixes perfectly!', date: '2024-12-07' },
            { user: 'Sachin V.', rating: 5, text: 'Using for 2 years. Consistent quality always.', date: '2024-11-21' },
            { user: 'Manish R.', rating: 4, text: 'Great protein. Slightly expensive but worth it.', date: '2024-11-05' }
        ])
    },
    // Books & Education
    {
        name: 'Atomic Habits by James Clear (Hardcover)',
        category: 'Books',
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
        price: 499, original_price: 799, discount: 38,
        description: 'Bestseller | 306 Pages | Proven Framework for Habits | #1 NYT Bestseller | Used by NFL, NBA, Fortune 500',
        rating: 4.8, review_count: 89234,
        reviews: JSON.stringify([
            { user: 'Vikram S.', rating: 5, text: 'Life changing book! Apply one chapter and see results.', date: '2024-12-10' },
            { user: 'Lakshmi N.', rating: 5, text: 'Simple, practical, and incredibly powerful advice.', date: '2024-11-25' },
            { user: 'Gaurav M.', rating: 5, text: 'Must read for everyone. Should be taught in schools.', date: '2024-11-09' }
        ])
    },
    // Furniture & Home Decor
    {
        name: 'IKEA MALM Queen Bed Frame with Storage',
        category: 'Furniture',
        image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80',
        price: 24990, original_price: 34990, discount: 29,
        description: '4 Storage Drawers | Queen Size | White/Oak Finish | Slatted Base Included | max load 250kg | Easy Assembly',
        rating: 4.3, review_count: 5821,
        reviews: JSON.stringify([
            { user: 'Ananya V.', rating: 4, text: 'Great storage solution. Assembly took 3 hours but worth it!', date: '2024-11-27' },
            { user: 'Rohit C.', rating: 4, text: 'Solid and sturdy. Drawers slide smoothly.', date: '2024-11-12' },
            { user: 'Nisha T.', rating: 5, text: 'Beautiful design. Completely transformed our bedroom.', date: '2024-10-22' }
        ])
    },
    {
        name: 'Pepper Table Top Gas Stove 4 Burner',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1556909079-1f8ece8e3f40?w=400&q=80',
        price: 5499, original_price: 8999, discount: 39,
        description: 'Toughened Glass | 4 Brass Burners | Auto Ignition | Powder Coated Pan Supports | ISI Marked | 2yr Warranty',
        rating: 4.2, review_count: 12834,
        reviews: JSON.stringify([
            { user: 'Usha M.', rating: 4, text: 'Sturdy and reliable. Flame is very even.', date: '2024-11-29' },
            { user: 'Girish P.', rating: 4, text: 'Good quality burners. Easy to clean glass top.', date: '2024-11-13' },
            { user: 'Meera A.', rating: 5, text: 'Works perfectly. Great value for money.', date: '2024-10-26' }
        ])
    },
    // Personal Care & Beauty
    {
        name: 'Philips Series 9000 Wet & Dry Electric Shaver',
        category: 'Personal Care',
        image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80',
        price: 12999, original_price: 19995, discount: 35,
        description: 'V-Track Blades | Flexing Shaving Heads | 8D SmartClick | 60min Runtime | Fast Charge 5min | App Connected',
        rating: 4.4, review_count: 7234,
        reviews: JSON.stringify([
            { user: 'Abhijeet R.', rating: 5, text: 'Closest shave I have ever got from an electric shaver!', date: '2024-12-05' },
            { user: 'Vinod M.', rating: 4, text: 'Smart cleaning station is a great addition. Worth the price.', date: '2024-11-18' },
            { user: 'Suhas V.', rating: 4, text: 'Smooth on skin. Battery life is great too.', date: '2024-10-29' }
        ])
    },
    {
        name: "L'Oreal Paris Revitalift Face Serum",
        category: 'Personal Care',
        image_url: 'https://images.unsplash.com/photo-1556228578-9f8056f4f08e?w=400&q=80',
        price: 649, original_price: 1199, discount: 46,
        description: '1.5% Pure Hyaluronic Acid | 2.5% Vitamin C | Anti-Aging | 50ml | All Skin Types | Dermatologist Tested',
        rating: 4.3, review_count: 28341,
        reviews: JSON.stringify([
            { user: 'Pallavi S.', rating: 5, text: 'Skin looks so much more hydrated after just 2 weeks!', date: '2024-12-08' },
            { user: 'Ritika B.', rating: 4, text: 'Good serum. Non-greasy and absorbs quickly.', date: '2024-11-22' },
            { user: 'Smita N.', rating: 4, text: 'Visible improvement in skin texture after a month.', date: '2024-11-06' }
        ])
    },
    // Toys & Baby
    {
        name: 'LEGO Technic Formula E Car 42166',
        category: 'Toys & Games',
        image_url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
        price: 3499, original_price: 5499, discount: 36,
        description: '240 Pieces | Authentic F1 Car | Moving Engine | Ages 8+ | Compatible with all LEGO Sets | Collector Edition',
        rating: 4.7, review_count: 4523,
        reviews: JSON.stringify([
            { user: 'Siddharth K.', rating: 5, text: 'My 9-yr-old built it all by himself! Great bonding activity.', date: '2024-12-03' },
            { user: 'Prathima V.', rating: 5, text: 'LEGO quality is always top-notch. Kid loves it!', date: '2024-11-16' },
            { user: 'Gopal N.', rating: 4, text: 'Challenging but rewarding build. Looks great on display.', date: '2024-10-27' }
        ])
    },
    // Gaming
    {
        name: 'Sony PlayStation 5 Slim Disc Edition',
        category: 'Gaming',
        image_url: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80',
        price: 44990, original_price: 54990, discount: 18,
        description: 'Custom AMD CPU/GPU | Ray Tracing | 4K 120fps | 1TB NVMe SSD | DualSense Controller | Haptic Feedback',
        rating: 4.8, review_count: 34521,
        reviews: JSON.stringify([
            { user: 'Saurav D.', rating: 5, text: 'The DualSense haptic feedback is mind-blowing. Gaming is next level!', date: '2024-12-09' },
            { user: 'Akash T.', rating: 5, text: 'PS5 is incredible. Loading times are effectively zero.', date: '2024-11-24' },
            { user: 'Deepak N.', rating: 5, text: 'Best gaming console ever made. Graphics are stunning!', date: '2024-11-08' }
        ])
    },
    {
        name: 'Logitech G Pro X Superlight 2 Gaming Mouse',
        category: 'Gaming',
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
        price: 14995, original_price: 19995, discount: 25,
        description: 'HERO 25K Sensor | 60g Ultra-Light | 95hr Battery | 5 Programmable Buttons | PTFE Feet | LIGHTSPEED Wireless',
        rating: 4.6, review_count: 8921,
        reviews: JSON.stringify([
            { user: 'Rohan P.', rating: 5, text: 'This mouse is butter smooth. Zero latency!', date: '2024-12-07' },
            { user: 'Tanish S.', rating: 5, text: 'Pro gamers use it for a reason. Worth every rupee.', date: '2024-11-21' },
            { user: 'Mihir V.', rating: 4, text: 'Great sensor, incredibly light. Battery life is amazing.', date: '2024-11-05' }
        ])
    },
    // Kitchen
    {
        name: 'Morphy Richards OTG 60L Besta',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
        price: 8495, original_price: 13995, discount: 39,
        description: '60L Capacity | 6 Heating Modes | 3 Heating Elements | Convection Fan | Motorized Rotisserie | 2yr Warranty',
        rating: 4.3, review_count: 9823,
        reviews: JSON.stringify([
            { user: 'Geeta S.', rating: 5, text: 'Bakes perfectly even! Pizza comes out restaurant quality.', date: '2024-11-30' },
            { user: 'Pradeep R.', rating: 4, text: 'Good OTG. Temperature is accurate and consistent.', date: '2024-11-14' },
            { user: 'Amruta K.', rating: 4, text: 'Great capacity for a family. Rotisserie works wonderfully.', date: '2024-10-23' }
        ])
    },
    // Additional
    {
        name: 'DJI Mini 4 Pro Drone Combo',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80',
        price: 74999, original_price: 94999, discount: 21,
        description: '4K/60fps HDR Video | 48MP Camera | Omnidirectional Obstacle Sensing | 34min Flight | 20km Range | Under 249g',
        rating: 4.6, review_count: 3241,
        reviews: JSON.stringify([
            { user: 'Pradeep S.', rating: 5, text: 'Incredible footage quality. Obstacle avoidance works perfectly.', date: '2024-12-04' },
            { user: 'Riya M.', rating: 5, text: 'So easy to fly. Videos look absolutely cinematic!', date: '2024-11-18' },
            { user: 'Chetan V.', rating: 4, text: 'Best compact drone available. Range is impressive.', date: '2024-10-30' }
        ])
    },
    {
        name: 'Weber Original Kettle Premium BBQ Grill',
        category: 'Garden & Outdoors',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
        price: 19999, original_price: 29999, discount: 33,
        description: '57cm Cooking Grate | Porcelain-Enameled Bowl | One-Touch Cleaning | Tuck-Away Lid Holder | 10yr Warranty',
        rating: 4.5, review_count: 4123,
        reviews: JSON.stringify([
            { user: 'Mahesh B.', rating: 5, text: 'Weber quality is legendary. BBQ parties are next level!', date: '2024-12-01' },
            { user: 'Sanket R.', rating: 4, text: 'Great heat retention. Even cooking every time.', date: '2024-11-15' },
            { user: 'Neelam A.', rating: 5, text: 'Solid built to last a lifetime. Weekend BBQs sorted!', date: '2024-10-24' }
        ])
    },
    {
        name: 'Fossil Gen 6 Smartwatch 44mm',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80',
        price: 14995, original_price: 22995, discount: 35,
        description: 'Wear OS by Google | Snapdragon 4100+ | Heart Rate | SpO2 | GPS | NFC Pay | Rapid Charging | AMOLED Display',
        rating: 4.2, review_count: 8421,
        reviews: JSON.stringify([
            { user: 'Aakash L.', rating: 4, text: 'Looks stunning! Wear OS works smoothly.', date: '2024-11-28' },
            { user: 'Payal M.', rating: 4, text: 'Great classic watch look with smart features.', date: '2024-11-12' },
            { user: 'Sunil K.', rating: 5, text: 'Best Android compatible smartwatch out there.', date: '2024-10-21' }
        ])
    }
];

/**
 * Generate a random slug for a shop
 */
function generateSlug(tgId) {
    const rand = crypto.randomBytes(4).toString('hex');
    return `shop-${rand}`;
}

/**
 * Create a shop + seed 30 products for a new user
 */
function createShopForUser(tgId) {
    const slug = generateSlug(tgId);

    const shopId = db.prepare(`
    INSERT INTO shops (tg_id, slug) VALUES (?, ?)
    ON CONFLICT(tg_id) DO UPDATE SET slug = slug
    RETURNING id
  `).get(tgId, slug);

    if (!shopId) return;

    // Check if products already seeded
    const count = db.prepare('SELECT COUNT(*) as c FROM products WHERE shop_id = ?').get(shopId.id);
    if (count.c > 0) return;

    const insertProduct = db.prepare(`
    INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    const insertMany = db.transaction((products) => {
        for (const p of products) {
            insertProduct.run(shopId.id, p.name, p.category, p.image_url, p.price, p.original_price, p.discount, p.description, p.rating, p.review_count, p.reviews);
        }
    });

    insertMany(DEFAULT_PRODUCTS);
    return slug;
}

module.exports = { createShopForUser, generateSlug };

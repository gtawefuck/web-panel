const db = require('./db');
const crypto = require('crypto');

// 30 realistic products exported for reseeding
const PRODUCTS = [
    // Electronics (8)
    {
        name: 'Samsung Galaxy S24 Ultra 5G',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=90',
        price: 89999, original_price: 134999, discount: 33,
        description: '12GB RAM | 256GB Storage | 200MP Camera | 5000mAh Battery | S Pen Included | IP68 Water Resistant | Snapdragon 8 Gen 3',
        reviews: [
            { user: 'Rahul M.', rating: 5, text: 'Absolutely stunning phone! Camera quality is unreal.', date: '2024-12-10' },
            { user: 'Priya S.', rating: 4, text: 'Best Android phone right now. Battery could be better.', date: '2024-11-28' },
            { user: 'Arun K.', rating: 5, text: 'Worth every penny. S Pen is so useful!', date: '2024-11-15' }
        ], rating: 4.6, review_count: 12847
    },
    {
        name: 'Apple iPhone 15 Pro Max 256GB',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=90',
        price: 134900, original_price: 159900, discount: 16,
        description: 'A17 Pro Chip | Titanium Design | 48MP Main Camera | USB-C | Action Button | ProRes Video | Always-On Display',
        reviews: [
            { user: 'Sneha R.', rating: 5, text: 'Best iPhone ever. Titanium build feels premium.', date: '2025-01-05' },
            { user: 'Vikram T.', rating: 4, text: 'Camera is insane. ProRes video is a game changer.', date: '2024-12-20' },
            { user: 'Ananya D.', rating: 5, text: 'Switched from Android and never looking back.', date: '2024-12-08' }
        ], rating: 4.7, review_count: 23541
    },
    {
        name: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=90',
        price: 24990, original_price: 34990, discount: 29,
        description: 'Industry-Leading ANC | 30hr Battery | Hi-Res Audio | Multipoint Connection | Speak-to-Chat | Foldable Design',
        reviews: [
            { user: 'Mohan L.', rating: 5, text: 'Best noise cancellation headphones in the market.', date: '2024-12-15' },
            { user: 'Kritika S.', rating: 4, text: 'Sound quality is amazing. Very comfortable.', date: '2024-11-30' },
            { user: 'Arjun P.', rating: 5, text: 'Worth every rupee. Love the speak-to-chat feature.', date: '2024-11-18' }
        ], rating: 4.5, review_count: 8932
    },
    {
        name: 'LG 55-inch 4K OLED Smart TV',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=90',
        price: 79990, original_price: 129990, discount: 38,
        description: 'Self-Lit OLED | α9 Gen6 Processor | Dolby Vision IQ | AirPlay 2 | ThinQ AI | WebOS | Magic Remote Included',
        reviews: [
            { user: 'Suresh N.', rating: 5, text: 'Picture quality is out of this world. OLED is worth it.', date: '2025-01-02' },
            { user: 'Pooja M.', rating: 4, text: 'Stunning TV but took time to set up smart features.', date: '2024-12-18' },
            { user: 'Karthik R.', rating: 5, text: 'Best investment for home theater.', date: '2024-12-01' }
        ], rating: 4.8, review_count: 5621
    },
    {
        name: 'MacBook Air 15" M3 Chip 8GB/256GB',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=90',
        price: 114900, original_price: 134900, discount: 15,
        description: 'Apple M3 Chip | 15.3" Liquid Retina Display | 18hr Battery | MagSafe Charging | Fanless Design | 35W Dual USB-C',
        reviews: [
            { user: 'Nisha T.', rating: 5, text: 'Incredibly fast and silent. Battery lasts all day.', date: '2025-01-10' },
            { user: 'DevR.', rating: 4, text: 'M3 is blazing fast. Only 8GB RAM feels limiting.', date: '2024-12-22' },
            { user: 'Meera J.', rating: 5, text: 'Perfect for students and professionals alike.', date: '2024-12-05' }
        ], rating: 4.7, review_count: 9823
    },
    {
        name: 'Canon EOS R50 Mirrorless Camera Kit',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=90',
        price: 64990, original_price: 89990, discount: 28,
        description: '24.2MP APS-C Sensor | 4K Video | Dual Pixel AF | Wi-Fi & Bluetooth | 15-45mm Kit Lens | Compact & Lightweight',
        reviews: [
            { user: 'Rohit V.', rating: 5, text: 'Best mirrorless for beginners. Autofocus is incredible.', date: '2024-12-12' },
            { user: 'Sunita K.', rating: 4, text: 'Great camera. 4K video is very smooth.', date: '2024-11-25' },
            { user: 'Amit G.', rating: 4, text: 'Compact and powerful. Perfect travel camera.', date: '2024-11-10' }
        ], rating: 4.4, review_count: 3241
    },
    {
        name: 'Bose SoundLink Max Portable Speaker',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=90',
        price: 29900, original_price: 39900, discount: 25,
        description: '20hr Playtime | IP67 Waterproof | PartyMode Up to 100 Speakers | Stereo Sound | USB-C Fast Charging | Fabric Strap',
        reviews: [
            { user: 'Deepak M.', rating: 5, text: 'Incredible bass. Works perfectly at parties.', date: '2024-12-08' },
            { user: 'Riya P.', rating: 4, text: 'Sound quality justifies the price. IP67 is great.', date: '2024-11-28' },
            { user: 'Lokesh S.', rating: 5, text: 'Battery life is insane. Highly recommended!', date: '2024-11-15' }
        ], rating: 4.5, review_count: 4512
    },
    {
        name: 'OnePlus 12 5G 16GB RAM 512GB',
        category: 'Electronics',
        image_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=90',
        price: 54999, original_price: 69999, discount: 21,
        description: 'Snapdragon 8 Gen 3 | 50MP Hasselblad Camera | 100W SuperVOOC | LTPO AMOLED | 5400mAh Battery | Alert Slider',
        reviews: [
            { user: 'Varun S.', rating: 5, text: 'Fastest charging phone I have ever used. 100W!', date: '2025-01-08' },
            { user: 'Kavitha R.', rating: 4, text: 'Great performance. Hasselblad camera is excellent.', date: '2024-12-25' },
            { user: 'Sanjay T.', rating: 5, text: 'Value for money king. Nothing beats this at this price.', date: '2024-12-10' }
        ], rating: 4.5, review_count: 15632
    },

    // Home Appliances (5)
    {
        name: 'Dyson V15 Detect Absolute Cordless Vacuum',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=90',
        price: 51900, original_price: 64900, discount: 20,
        description: 'Laser Dust Detection | HEPA Filtration | 60min Runtime | LCD Screen | Auto-boost Mode | 14 Accessories Included',
        reviews: [
            { user: 'Preeti L.', rating: 5, text: 'The laser detection shows every speck of dust. Amazing!', date: '2024-12-20' },
            { user: 'Nikhil M.', rating: 4, text: 'Powerful suction. 60 min runtime is impressive.', date: '2024-12-05' },
            { user: 'Anita R.', rating: 5, text: 'No more dirty floors. Best vacuum cleaner ever.', date: '2024-11-20' }
        ], rating: 4.3, review_count: 6732
    },
    {
        name: 'Samsung 253L Convertible 5-in-1 Refrigerator',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=90',
        price: 24990, original_price: 36990, discount: 32,
        description: '5-in-1 Convertible Modes | Digital Inverter | Anti-Bacterial | SpaceMax Technology | Moist Fresh Zone | 5 Star Rating',
        reviews: [
            { user: 'Radha S.', rating: 5, text: 'The convertible modes are genius. Great for parties.', date: '2024-12-18' },
            { user: 'Pranav K.', rating: 4, text: 'Energy efficient and spacious. Perfect for family.', date: '2024-12-01' },
            { user: 'Sudha M.', rating: 4, text: 'Good refrigerator. Quiet operation.', date: '2024-11-15' }
        ], rating: 4.3, review_count: 11234
    },
    {
        name: 'LG 8Kg 5 Star Inverter Washing Machine',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=90',
        price: 31490, original_price: 45990, discount: 32,
        description: 'AI Direct Drive | Steam Wash | ThinQ App Control | 6 Motion Technology | Turbowash | Anti-Crease | 5 Star BEE',
        reviews: [
            { user: 'Kumari J.', rating: 5, text: 'ThinQ app is incredible. Controls wash from phone.', date: '2024-12-15' },
            { user: 'Manoj T.', rating: 4, text: 'Very quiet wash. Clothes feel fresh and clean.', date: '2024-11-28' },
            { user: 'Leela R.', rating: 5, text: 'Best washing machine. Steam wash removes all stains.', date: '2024-11-12' }
        ], rating: 4.5, review_count: 8921
    },
    {
        name: 'Philips HL7777 Mixer Grinder 1000W',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=90',
        price: 2999, original_price: 5299, discount: 43,
        description: '1000W Motor | 3 Jars | Stainless Steel Blades | Dry & Wet Grinding | Liquidizing | 5 Year Motor Warranty',
        reviews: [
            { user: 'Geetha S.', rating: 5, text: 'Powerful grinder. Makes perfect chutneys!', date: '2024-12-10' },
            { user: 'Rahul P.', rating: 4, text: 'Good for daily use. Easy to clean.', date: '2024-11-25' },
            { user: 'Savita D.', rating: 4, text: 'Works great. Good quality jars.', date: '2024-11-08' }
        ], rating: 4.2, review_count: 4521
    },
    {
        name: 'Voltas 1.5 Ton 5 Star Split AC',
        category: 'Home Appliances',
        image_url: 'https://images.unsplash.com/photo-1558618047-f5e3a5ef5fe5?w=600&q=90',
        price: 35990, original_price: 54990, discount: 35,
        description: '5 Star Rated | Inverter Compressor | Auto-Restart | Sleep Mode | 100% Copper | Anti-Dust Filter | WiFi Ready',
        reviews: [
            { user: 'Santhosh R.', rating: 5, text: 'Best AC for Indian summers. Cools room in 5 minutes!', date: '2024-12-20' },
            { user: 'Vanitha M.', rating: 4, text: 'Very energy efficient. Low electricity bills.', date: '2024-12-05' },
            { user: 'Babu K.', rating: 4, text: 'Silent operation. Good value.', date: '2024-11-20' }
        ], rating: 4.3, review_count: 7834
    },

    // Fashion (4)
    {
        name: 'Levi\'s 511 Slim Fit Men\'s Jeans',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=90',
        price: 1999, original_price: 3999, discount: 50,
        description: 'Slim Fit | Stretch Denim | 98% Cotton 2% Elastane | Button Fly | 5 Pocket Styling | Available in multiple washes',
        reviews: [
            { user: 'Aryan S.', rating: 5, text: 'Perfect fit. Denim quality is excellent.', date: '2024-12-12' },
            { user: 'Kabir M.', rating: 4, text: 'Nice jeans. Comfortable for all-day wear.', date: '2024-11-28' },
            { user: 'Rohan V.', rating: 4, text: 'Good stretch. Easy to move in.', date: '2024-11-10' }
        ], rating: 4.3, review_count: 18421
    },
    {
        name: 'Adidas Running Shoes Ultraboost 22',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=90',
        price: 5499, original_price: 12999, discount: 58,
        description: 'Boost Midsole | Primeknit Upper | Continental Rubber Outsole | Linear Energy Push System | Lightweight & Breathable',
        reviews: [
            { user: 'Mohit J.', rating: 5, text: 'Best running shoes I have ever worn. Pure comfort.', date: '2024-12-18' },
            { user: 'Tanya K.', rating: 4, text: 'Love the boost cushioning. Great for marathons.', date: '2024-12-02' },
            { user: 'Raj S.', rating: 5, text: 'Extremely comfortable and light. A++', date: '2024-11-18' }
        ], rating: 4.6, review_count: 9871
    },
    {
        name: 'H&M Women\'s Floral Midi Dress',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=90',
        price: 1299, original_price: 2199, discount: 41,
        description: 'Floral Print | Viscose Fabric | V-neck | Short Sleeves | Flared Skirt | Regular fit | Knee-length | Machine washable',
        reviews: [
            { user: 'Nandini P.', rating: 5, text: 'Beautiful dress! Fabric quality is great.', date: '2024-12-14' },
            { user: 'Shruti D.', rating: 4, text: 'Runs a bit large but looks gorgeous.', date: '2024-11-30' },
            { user: 'Pallavi M.', rating: 5, text: 'Perfect for parties and casual outings.', date: '2024-11-15' }
        ], rating: 4.2, review_count: 5641
    },
    {
        name: 'Ray-Ban Aviator Classic Sunglasses',
        category: 'Fashion',
        image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=90',
        price: 4500, original_price: 7800, discount: 42,
        description: 'UV400 Protection | Metal Frame | Crystal Green G-15 Lens | Iconic Aviator Shape | Includes Case & Cleaning Cloth',
        reviews: [
            { user: 'Vivek K.', rating: 5, text: 'Classic sunglasses. Build quality is top-notch.', date: '2024-12-10' },
            { user: 'Ishaan R.', rating: 4, text: 'Looks amazing. UV protection is great.', date: '2024-11-25' },
            { user: 'Vaidehi S.', rating: 5, text: 'Timeless design. Worth every penny.', date: '2024-11-08' }
        ], rating: 4.5, review_count: 12983
    },

    // Sports & Fitness (3)
    {
        name: 'Decathlon Domyos Weight Training Dumbbell Set 20kg',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=90',
        price: 2999, original_price: 5199, discount: 42,
        description: 'Fixed Weight | Hexagonal Shape | Anti-Roll Design | Rubber Coated | Ergonomic Grip | Durable Cast Iron Core',
        reviews: [
            { user: 'Gaurav T.', rating: 5, text: 'Great quality dumbbells. Rubber coating is durable.', date: '2024-12-16' },
            { user: 'Krish P.', rating: 4, text: 'Good grip. Hex design prevents rolling.', date: '2024-12-01' },
            { user: 'Aman S.', rating: 4, text: 'Perfect for home workouts. Great value.', date: '2024-11-14' }
        ], rating: 4.3, review_count: 3241
    },
    {
        name: 'Fitbit Charge 6 Advanced Fitness Tracker',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=90',
        price: 12999, original_price: 18999, discount: 32,
        description: 'Built-in GPS | Heart Rate Monitor | SpO2 Sensor | Stress Score | Sleep Tracking | 7-Day Battery | Water Resistant',
        reviews: [
            { user: 'Divya R.', rating: 5, text: 'Best fitness tracker. GPS accuracy is excellent.', date: '2024-12-20' },
            { user: 'Siddharth M.', rating: 4, text: 'Love the sleep tracking. Battery lasts a week.', date: '2024-12-05' },
            { user: 'Neha K.', rating: 4, text: 'Heart rate monitoring is very accurate.', date: '2024-11-18' }
        ], rating: 4.3, review_count: 7841
    },
    {
        name: 'Nivia Storm Football Size 5',
        category: 'Sports & Fitness',
        image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=90',
        price: 799, original_price: 1299, discount: 38,
        description: '32 Panel | TPU Material | Air Retention Bladder | Hand Stitched | FIFA Approved | Suitable for All Surfaces',
        reviews: [
            { user: 'Sachin B.', rating: 4, text: 'Good ball for price. Durable and well-made.', date: '2024-12-08' },
            { user: 'Ravi S.', rating: 4, text: 'Kids love it. Air retention is good.', date: '2024-11-22' },
            { user: 'Mohan D.', rating: 5, text: 'Perfect for playground. Great quality.', date: '2024-11-05' }
        ], rating: 4.0, review_count: 2841
    },

    // Furniture (2)
    {
        name: 'Wakefit Orthopaedic Memory Foam Mattress – Queen',
        category: 'Furniture',
        image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=90',
        price: 12999, original_price: 22490, discount: 42,
        description: '6-inch Queen | Medium Firm | Memory Foam + HR Foam | Breathable Knit Fabric | 100 Night Trial | 10 Year Warranty',
        reviews: [
            { user: 'Anand R.', rating: 5, text: 'Changed my sleep quality completely. 100 nights trial is great.', date: '2024-12-15' },
            { user: 'Priya M.', rating: 4, text: 'Very comfortable. Good back support.', date: '2024-12-01' },
            { user: 'Ramesh T.', rating: 5, text: 'Best mattress for the price. Highly recommended.', date: '2024-11-18' }
        ], rating: 4.4, review_count: 9832
    },
    {
        name: 'Nilkamal Elgin Premium Office Chair',
        category: 'Furniture',
        image_url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=90',
        price: 8999, original_price: 15999, discount: 44,
        description: 'Lumbar Support | Adjustable Armrests | Breathable Mesh Back | Height Adjustable | 360° Swivel | 150kg Load Capacity',
        reviews: [
            { user: 'Vijay K.', rating: 5, text: 'Perfect office chair. Lumbar support is amazing.', date: '2024-12-18' },
            { user: 'Seema L.', rating: 4, text: 'Good quality. Assembly was easy.', date: '2024-12-02' },
            { user: 'Harish M.', rating: 4, text: 'Comfortable for long hours. Great value.', date: '2024-11-15' }
        ], rating: 4.2, review_count: 5213
    },

    // Books (2)
    {
        name: 'Atomic Habits by James Clear (Paperback)',
        category: 'Books',
        image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=90',
        price: 399, original_price: 599, discount: 33,
        description: '#1 NYT Bestseller | 320 Pages | Paperback | Proven system for building good habits | Avery Publisher | English',
        reviews: [
            { user: 'Shweta V.', rating: 5, text: 'Life changing book. Must read for everyone.', date: '2024-12-20' },
            { user: 'Kiran M.', rating: 5, text: 'Practical and actionable. Changed my daily routine.', date: '2024-12-10' },
            { user: 'Ajay T.', rating: 4, text: 'Great insights. Easy to read and implement.', date: '2024-11-25' }
        ], rating: 4.8, review_count: 31241
    },
    {
        name: 'The Psychology of Money by Morgan Housel',
        category: 'Books',
        image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&q=90',
        price: 349, original_price: 499, discount: 30,
        description: 'Timeless lessons on wealth | 256 Pages | Paperback | International Bestseller | Harriman House | English',
        reviews: [
            { user: 'Neha S.', rating: 5, text: 'Best finance book for beginners and experts alike.', date: '2024-12-14' },
            { user: 'Rohit D.', rating: 4, text: 'Changed my perspective on money. Highly recommended.', date: '2024-11-30' },
            { user: 'Aisha K.', rating: 5, text: 'Simple language with deep insights.', date: '2024-11-16' }
        ], rating: 4.7, review_count: 24512
    },

    // Personal Care (2)
    {
        name: 'Philips BT3231 Cordless Beard Trimmer',
        category: 'Personal Care',
        image_url: 'https://images.unsplash.com/photo-1621607505117-c87ad2e31b4a?w=600&q=90',
        price: 1299, original_price: 2099, discount: 38,
        description: '20 Length Settings | 60min Runtime | Fast Charge | Self-Sharpening Blades | Waterproof | Rounded Blade Tips',
        reviews: [
            { user: 'Sameer R.', rating: 5, text: 'Sharp blades. Battery lasts very long.', date: '2024-12-12' },
            { user: 'Tanvir S.', rating: 4, text: 'Good trimmer for the price. Easy to use.', date: '2024-11-28' },
            { user: 'Girish P.', rating: 4, text: 'Clean trim every time. Waterproof is useful.', date: '2024-11-10' }
        ], rating: 4.3, review_count: 15421
    },
    {
        name: 'Mamaearth Vitamin C Face Serum 30ml',
        category: 'Personal Care',
        image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=90',
        price: 399, original_price: 699, discount: 43,
        description: 'Vitamin C & Turmeric | Brightening | Reduces Dark Spots | Hyaluronic Acid | Paraben Free | Dermatologically Tested',
        reviews: [
            { user: 'Madhuri S.', rating: 5, text: 'Skin looks visibly brighter. Love this serum!', date: '2024-12-18' },
            { user: 'Roshni K.', rating: 4, text: 'Reduced dark spots in 2 weeks. Good product.', date: '2024-12-04' },
            { user: 'Devika R.', rating: 4, text: 'Light texture. Absorbs fast. No stickiness.', date: '2024-11-20' }
        ], rating: 4.2, review_count: 18732
    },

    // Gaming (2)
    {
        name: 'Sony DualSense Wireless Controller PS5',
        category: 'Gaming',
        image_url: 'https://images.unsplash.com/photo-1635693425019-a386bdc68ed7?w=600&q=90',
        price: 5690, original_price: 7190, discount: 21,
        description: 'Haptic Feedback | Adaptive Triggers | Built-in Mic | USB-C Charging | 12hr Battery | Create Button | Touch Pad',
        reviews: [
            { user: 'Naveen G.', rating: 5, text: 'Haptic feedback is mind-blowing. Best controller ever.', date: '2024-12-15' },
            { user: 'Akash T.', rating: 5, text: 'Adaptive triggers change gaming forever.', date: '2024-12-01' },
            { user: 'Sujith R.', rating: 4, text: 'Great controller. Battery life could be longer.', date: '2024-11-15' }
        ], rating: 4.7, review_count: 21432
    },
    {
        name: 'boAt Rockerz 450 Wireless Headphones',
        category: 'Gaming',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=90',
        price: 1299, original_price: 3990, discount: 67,
        description: '15hr Playback | 40mm Drivers | Padded Earcups | Foldable Design | Voice Assistant | Dual Mode (BT + Wired)',
        reviews: [
            { user: 'Navdeep K.', rating: 4, text: 'Bass is great. Good for gaming and music.', date: '2024-12-10' },
            { user: 'Pawan S.', rating: 4, text: 'Best budget gaming headphones available.', date: '2024-11-25' },
            { user: 'Suresh M.', rating: 4, text: 'Comfortable fit. Clear audio quality.', date: '2024-11-08' }
        ], rating: 4.1, review_count: 45921
    },

    // Toys (2)
    {
        name: 'LEGO Technic Bugatti Chiron Building Set',
        category: 'Toys & Games',
        image_url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=90',
        price: 12999, original_price: 19999, discount: 35,
        description: '3599 Pieces | 1:8 Scale | Moving Engine | Spoiler | Gearbox | For Ages 16+ | Includes Chiron collectible book',
        reviews: [
            { user: 'Ratan M.', rating: 5, text: 'Building experience is incredible. Display piece!', date: '2024-12-18' },
            { user: 'Arjun L.', rating: 5, text: 'Complex and rewarding build. Kids love it.', date: '2024-12-04' },
            { user: 'Meenakshi S.', rating: 4, text: 'Premium quality. Worth the investment.', date: '2024-11-20' }
        ], rating: 4.8, review_count: 3421
    },

    // Gifts (3)
    {
        name: 'Personalized LED Photo Frame with Name',
        category: 'Gifts',
        image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&q=90',
        price: 599, original_price: 1499, discount: 60,
        description: 'Acrylic 3D LED Lamp | Customized Photo & Name | USB Powered | 7 Color Changing | Perfect Birthday/Anniversary Gift',
        reviews: [
            { user: 'Kavya R.', rating: 5, text: 'Beautiful gift! My friend loved it. Colors are amazing.', date: '2025-01-05' },
            { user: 'Deepa M.', rating: 4, text: 'Good quality. Customization was perfect.', date: '2024-12-20' },
            { user: 'Ankit S.', rating: 5, text: 'Delivered quickly. Looks exactly like the photo.', date: '2024-12-10' }
        ], rating: 4.4, review_count: 8721
    },
    {
        name: 'Ferrero Rocher Premium Chocolate Gift Box 24pc',
        category: 'Gifts',
        image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=90',
        price: 749, original_price: 999, discount: 25,
        description: '24 Pieces | Hazelnut & Milk Chocolate | Gold Foil Wrapped | Premium Gift Box | Perfect for Festivals & Celebrations',
        reviews: [
            { user: 'Snehal P.', rating: 5, text: 'Best chocolate gift. Always impresses everyone.', date: '2024-12-25' },
            { user: 'Rajesh K.', rating: 4, text: 'Premium packaging. Chocolates are fresh and delicious.', date: '2024-12-15' },
            { user: 'Nisha T.', rating: 5, text: 'My go-to gift for every occasion.', date: '2024-12-01' }
        ], rating: 4.6, review_count: 15432
    },
    {
        name: 'TIED RIBBONS Romantic Gift Hamper for Couples',
        category: 'Gifts',
        image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=90',
        price: 899, original_price: 1999, discount: 55,
        description: 'Love Cushion + Greeting Card + Mug + Keychain | Valentine/Birthday Gift | Premium Gift Box Packing | Combo Set',
        reviews: [
            { user: 'Priyanka D.', rating: 5, text: 'Perfect anniversary gift. Wife loved it!', date: '2025-01-08' },
            { user: 'Arun W.', rating: 4, text: 'Good combo gift. Mug quality is nice.', date: '2024-12-22' },
            { user: 'Sneha M.', rating: 5, text: 'Beautiful packaging. Arrived on time for birthday.', date: '2024-12-05' }
        ], rating: 4.3, review_count: 6543
    },

    // Wellness & Massagers (3)
    {
        name: 'LifeLong Full Body Electric Massager Gun',
        category: 'Wellness',
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=90',
        price: 2499, original_price: 5999, discount: 58,
        description: '6 Speed Settings | 4 Massage Heads | Deep Tissue Percussion | Rechargeable | Portable | Pain Relief | Sports Recovery',
        reviews: [
            { user: 'Vikram S.', rating: 5, text: 'Amazing for muscle recovery after gym. Very powerful.', date: '2025-01-02' },
            { user: 'Anjali R.', rating: 4, text: 'Good build quality. Battery lasts 3-4 hours.', date: '2024-12-18' },
            { user: 'Suresh P.', rating: 5, text: 'Best purchase. Relieves back pain instantly.', date: '2024-12-08' }
        ], rating: 4.3, review_count: 11234
    },
    {
        name: 'Lifelong Rechargeable Body Massager Wand',
        category: 'Wellness',
        image_url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=600&q=90',
        price: 999, original_price: 2499, discount: 60,
        description: 'Wireless | 20 Vibration Modes | 8 Speeds | Waterproof | Flexible Neck | Full Body Relaxation | USB Rechargeable',
        reviews: [
            { user: 'Ritu M.', rating: 5, text: 'Very relaxing. Multiple modes are great. Quiet operation.', date: '2024-12-20' },
            { user: 'Amit K.', rating: 4, text: 'Good for neck and shoulder pain. Compact design.', date: '2024-12-10' },
            { user: 'Pooja S.', rating: 5, text: 'Excellent product. Battery lasts long. Waterproof is useful.', date: '2024-11-28' }
        ], rating: 4.2, review_count: 18923
    },
    {
        name: 'Dr Physio Electric Full Body Heating Pad',
        category: 'Wellness',
        image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=90',
        price: 799, original_price: 1999, discount: 60,
        description: 'Orthopaedic Pain Relief | 4 Temperature Settings | Auto Shut-Off | Washable Cover | For Back, Neck, Joints & Cramps',
        reviews: [
            { user: 'Sunita L.', rating: 5, text: 'Instant pain relief. Best for winter nights.', date: '2024-12-15' },
            { user: 'Kiran D.', rating: 4, text: 'Good heating pad. Auto shut-off is a safety plus.', date: '2024-12-01' },
            { user: 'Madhu R.', rating: 4, text: 'Comfortable and effective. Easy to wash.', date: '2024-11-20' }
        ], rating: 4.1, review_count: 9876
    },

    // Kitchen Appliances (3)
    {
        name: 'Prestige Iris 750W Mixer Grinder 3 Jars',
        category: 'Kitchen Appliances',
        image_url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=90',
        price: 2199, original_price: 4495, discount: 51,
        description: '750W Powerful Motor | Stainless Steel Blades | 3 Jars (Dry/Wet/Chutney) | Overload Protection | 2 Year Warranty',
        reviews: [
            { user: 'Lakshmi V.', rating: 5, text: 'Perfect grinding every time. Motor is very powerful.', date: '2024-12-20' },
            { user: 'Bharathi S.', rating: 4, text: 'Good quality. Easy to clean. Jars are durable.', date: '2024-12-05' },
            { user: 'Kamala R.', rating: 4, text: 'Best mixer in this price range. Daily use for 6 months.', date: '2024-11-18' }
        ], rating: 4.3, review_count: 12456
    },
    {
        name: 'Havells Instanio Prime 3L Instant Water Heater',
        category: 'Kitchen Appliances',
        image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=90',
        price: 3199, original_price: 5990, discount: 47,
        description: '3 Litre | 3000W | Color Changing LED | ISI Marked | Whirlflow Technology | Heavy Duty Anode Rod | 5 Star Rating',
        reviews: [
            { user: 'Rajmohan K.', rating: 5, text: 'Heats water super fast. LED indicator is brilliant.', date: '2024-12-18' },
            { user: 'Deepa G.', rating: 4, text: 'Energy efficient. Good build quality.', date: '2024-12-02' },
            { user: 'Vivek M.', rating: 5, text: 'Best geyser. Hot water in 2 minutes flat.', date: '2024-11-15' }
        ], rating: 4.4, review_count: 7654
    },
    {
        name: 'Butterfly Rapid 750W Juicer Mixer Grinder',
        category: 'Kitchen Appliances',
        image_url: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=90',
        price: 1799, original_price: 3595, discount: 50,
        description: '750W Motor | 4 Jars | Juicer Attachment | Stainless Steel Blades | Anti-Skid Feet | Hands-Free Operation',
        reviews: [
            { user: 'Meena T.', rating: 4, text: 'Great juicer. Makes smooth juice every time.', date: '2024-12-10' },
            { user: 'Harish S.', rating: 4, text: 'Good value for money. All 4 jars are useful.', date: '2024-11-25' },
            { user: 'Sarala D.', rating: 5, text: 'Perfect for daily kitchen use. Very powerful.', date: '2024-11-10' }
        ], rating: 4.2, review_count: 5678
    },

    // Grooming & Beauty (3)
    {
        name: 'Braun Silk-Expert Pro 5 IPL Hair Removal',
        category: 'Grooming',
        image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=90',
        price: 24999, original_price: 44990, discount: 44,
        description: 'SensoAdapt Skin Tone Sensor | 400,000 Flashes | FDA Cleared | 3 Comfort Modes | Virtual Body Plan App | Pouch Included',
        reviews: [
            { user: 'Ritika A.', rating: 5, text: 'Results visible after 4 weeks. Best home IPL device.', date: '2025-01-05' },
            { user: 'Swathi N.', rating: 4, text: 'Gentle on skin. Auto skin tone adjustment works well.', date: '2024-12-20' },
            { user: 'Prerna J.', rating: 5, text: 'No more salon visits! Worth every penny.', date: '2024-12-08' }
        ], rating: 4.5, review_count: 4321
    },
    {
        name: 'Dyson Airwrap Complete Hair Styler Multi',
        category: 'Grooming',
        image_url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=600&q=90',
        price: 44900, original_price: 54900, discount: 18,
        description: 'Coanda Airflow | 6 Attachments | Curl, Wave, Smooth & Dry | Heat Control | For All Hair Types | Travel Pouch',
        reviews: [
            { user: 'Meghna S.', rating: 5, text: 'Game changer! Curls and straightens perfectly.', date: '2024-12-22' },
            { user: 'Trisha P.', rating: 4, text: 'Premium quality. Hair looks salon-like every day.', date: '2024-12-10' },
            { user: 'Bhavna K.', rating: 5, text: 'Expensive but delivers results. No heat damage.', date: '2024-11-28' }
        ], rating: 4.6, review_count: 3456
    },
    {
        name: 'Vega Professional Pro Curl Hair Curler 25mm',
        category: 'Grooming',
        image_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&q=90',
        price: 899, original_price: 1850, discount: 51,
        description: 'Ceramic Coated Barrel | 25mm | Quick Heat Up | 360° Swivel Cord | Auto Shut-Off | Cool Tip | Temperature Control',
        reviews: [
            { user: 'Jyoti D.', rating: 4, text: 'Good curler for the price. Heats up quickly.', date: '2024-12-15' },
            { user: 'Shilpa M.', rating: 4, text: 'Nice curls that last all day. Easy to use.', date: '2024-12-01' },
            { user: 'Mansi R.', rating: 5, text: 'Professional quality at budget price. Love it!', date: '2024-11-18' }
        ], rating: 4.2, review_count: 7890
    },

    // Smart Home (2)
    {
        name: 'Amazon Echo Dot 5th Gen Smart Speaker',
        category: 'Smart Home',
        image_url: 'https://images.unsplash.com/photo-1543512214-318228f1e9ba?w=600&q=90',
        price: 4499, original_price: 5499, discount: 18,
        description: 'Improved Audio | Alexa Built-in | Smart Home Hub | Clock Display | Temperature Sensor | Bluetooth & 3.5mm Output',
        reviews: [
            { user: 'Taran J.', rating: 5, text: 'Best smart speaker. Alexa is very responsive.', date: '2024-12-20' },
            { user: 'Preeti K.', rating: 4, text: 'Good sound quality for its size. Clock display is handy.', date: '2024-12-05' },
            { user: 'Vikrant S.', rating: 5, text: 'Controls all my smart devices. Essential for smart home.', date: '2024-11-20' }
        ], rating: 4.4, review_count: 28456
    },
    {
        name: 'Mi 360° Home Security Camera 2K Pro',
        category: 'Smart Home',
        image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=90',
        price: 3999, original_price: 4999, discount: 20,
        description: '2K Super Clear | 360° View | AI Human Detection | Night Vision | Two-Way Audio | MicroSD up to 256GB | Mi Home App',
        reviews: [
            { user: 'Ganesh R.', rating: 5, text: '2K quality is superb. Night vision is crystal clear.', date: '2024-12-18' },
            { user: 'Smita P.', rating: 4, text: 'Easy setup. AI detection reduces false alerts.', date: '2024-12-05' },
            { user: 'Naveen M.', rating: 5, text: 'Best budget security camera. Worth every rupee.', date: '2024-11-22' }
        ], rating: 4.3, review_count: 11234
    },

    // Travel (2)
    {
        name: 'Safari Pentagon Hardside 55cm Cabin Luggage',
        category: 'Travel',
        image_url: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=90',
        price: 2499, original_price: 6990, discount: 64,
        description: 'Cabin Size 55cm | Polycarbonate | 4 Wheel 360° | TSA Lock | 5 Year Warranty | Lightweight 3.1kg | Expandable',
        reviews: [
            { user: 'Ravi T.', rating: 5, text: 'Excellent quality. Survived 10 flights without a scratch.', date: '2024-12-20' },
            { user: 'Anitha M.', rating: 4, text: 'Lightweight and spacious. TSA lock is a plus.', date: '2024-12-08' },
            { user: 'Karthik R.', rating: 5, text: 'Best cabin luggage at this price. Highly recommended.', date: '2024-11-25' }
        ], rating: 4.4, review_count: 14567
    },
    {
        name: 'Noise ColorFit Pro 5 Max Smartwatch AMOLED',
        category: 'Travel',
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=90',
        price: 3999, original_price: 8999, discount: 56,
        description: '1.96" AMOLED Display | Always-On | BT Calling | GPS | 100+ Sports Modes | SpO2 | Heart Rate | 7 Day Battery',
        reviews: [
            { user: 'Arjun B.', rating: 5, text: 'AMOLED display is stunning. BT calling works perfectly.', date: '2025-01-02' },
            { user: 'Divya S.', rating: 4, text: 'Great smartwatch for the price. GPS is accurate.', date: '2024-12-18' },
            { user: 'Suman K.', rating: 5, text: 'Battery easily lasts a week. Love the always-on display.', date: '2024-12-05' }
        ], rating: 4.3, review_count: 9876
    },

    // Stationery & Office (2)
    {
        name: 'Parker Vector Standard Roller Ball Pen Gift Set',
        category: 'Stationery',
        image_url: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&q=90',
        price: 399, original_price: 680, discount: 41,
        description: 'Classic Design | Stainless Steel | Smooth Writing | Gift Box | Roller Ball Tip | Refillable | Professional Look',
        reviews: [
            { user: 'Dr. Sharma', rating: 5, text: 'Elegant pen. Smooth writing. Perfect corporate gift.', date: '2024-12-15' },
            { user: 'Anil K.', rating: 4, text: 'Good quality. Gift box presentation is excellent.', date: '2024-12-01' },
            { user: 'Rekha S.', rating: 5, text: 'Gifted this for birthday. Everyone impressed.', date: '2024-11-18' }
        ], rating: 4.5, review_count: 11234
    },
    {
        name: 'AmazonBasics Mesh Office Desk Organizer Set',
        category: 'Stationery',
        image_url: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=600&q=90',
        price: 699, original_price: 1299, discount: 46,
        description: '6-Piece Set | File Sorter | Pencil Cup | Letter Tray | Memo Holder | Black Metal Mesh | Anti-Scratch Rubber Feet',
        reviews: [
            { user: 'Rohan J.', rating: 4, text: 'Keeps desk tidy. Good quality mesh.', date: '2024-12-10' },
            { user: 'Priya N.', rating: 5, text: 'Complete set. No more messy desk. Sturdy build.', date: '2024-11-28' },
            { user: 'Vivek T.', rating: 4, text: 'Functional and looks professional. Good value.', date: '2024-11-12' }
        ], rating: 4.2, review_count: 5678
    }
];

function generateSlug(tgId) {
    return 'shop-' + crypto.createHash('md5').update(String(tgId)).digest('hex').slice(0, 8);
}

function createShopForUser(tgId) {
    const existing = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(tgId);
    if (existing) return existing.slug;
    const slug = generateSlug(tgId);
    db.prepare('INSERT OR IGNORE INTO shops (tg_id, slug) VALUES (?, ?)').run(String(tgId), slug);
    const shop = db.prepare('SELECT id FROM shops WHERE tg_id = ?').get(String(tgId));
    const insert = db.prepare('INSERT INTO products (shop_id, name, category, image_url, price, original_price, discount, description, rating, review_count, reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const p of PRODUCTS) {
        insert.run(shop.id, p.name, p.category, p.image_url, p.price, p.original_price, p.discount, p.description, p.rating, p.review_count, JSON.stringify(p.reviews));
    }
    return slug;
}

module.exports = { createShopForUser, generateSlug, PRODUCTS };

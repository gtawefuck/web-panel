const db = require('./db');
const crypto = require('crypto');

const fkImg = (path, size = 832) =>
    `https://rukminim2.flixcart.com/image/${size}/${size}/xif0q/mobile/${path}?q=90&crop=false`;

const PRODUCTS = [
    // === MOBILES ===
    {
        name: 'MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)',
        brand: 'MOTOROLA', category: 'Mobiles',
        image_url: fkImg('1/k/r/-original-imahhqjwsngwkksu.jpeg'),
        price: 15999, original_price: 17999, discount: 11,
        description: 'Designed in collaboration with Pantone, the MOTOROLA g57 power 5G packs a massive 7000 mAh battery, a 50MP + 8MP rear camera and a smooth 6.72-inch LCD display.',
        rating: 4.4, review_count: 43159,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','Snapdragon 6s Gen 4 | Octa Core | 2.4 GHz','50MP + 8MP Rear Camera | 8MP Front','6.72 inch LCD 120Hz Display','7000 mAh Battery | TurboPower 30W','IP64 Splash, Water and Dust Resistant'],
            images: [fkImg('1/k/r/-original-imahhqjwsngwkksu.jpeg'),fkImg('h/h/m/-original-imahhqjwcywsynaq.jpeg'),fkImg('c/p/g/-original-imahhqjwmbxydvyy.jpeg'),fkImg('y/l/v/-original-imahhqjwgz7shhcx.jpeg'),fkImg('9/g/g/-original-imahhqjwef9h47wg.jpeg'),fkImg('5/u/v/-original-imahhqjw3anwcdza.jpeg'),fkImg('e/r/w/-original-imahhqjwav7hwyz6.jpeg'),fkImg('q/f/x/-original-imahhqjwhhwkfq5k.jpeg')],
            color_variants: ['Pantone Fluidity','Pantone Corsair','Pantone Regatta'],
            ratings_breakdown: {'5':27988,'4':9959,'3':2357,'2':854,'1':2001},
            specifications: [
                {group:'In The Box',items:[{label:'Sales Package',value:'Phone, USB Type C Cable, SIM Tray Ejector, Adhesive Foam, Soft Cover, Quick Start Guide'},{label:'Model Name',value:'g57 power 5G'},{label:'Color',value:'Pantone Fluidity'},{label:'SIM Type',value:'Dual Sim'}]},
                {group:'Display Features',items:[{label:'Display Size',value:'17.07 cm (6.72 inch)'},{label:'Resolution',value:'2400 x 1080 Pixels'},{label:'Display Type',value:'LCD with 120Hz Refresh Rate'}]},
                {group:'OS & Processor',items:[{label:'Operating System',value:'Android 15'},{label:'Processor',value:'Snapdragon 6s Gen 4'},{label:'Processor Core',value:'Octa Core'},{label:'Clock Speed',value:'2.4 GHz'}]},
                {group:'Memory & Storage',items:[{label:'RAM',value:'8 GB'},{label:'Internal Storage',value:'128 GB'},{label:'Expandable',value:'Up to 1 TB'}]},
                {group:'Camera',items:[{label:'Rear Camera',value:'50MP + 8MP'},{label:'Front Camera',value:'8MP'},{label:'Flash',value:'LED Flash'}]},
                {group:'Battery',items:[{label:'Battery Capacity',value:'7000 mAh'},{label:'Type',value:'Lithium Polymer'},{label:'Quick Charging',value:'TurboPower 30W'}]},
                {group:'Warranty',items:[{label:'Warranty Summary',value:'1 Year on Handset, 6 Months on Accessories'}]}
            ],
            reviews: [
                {rating:5,title:'Mind-blowing purchase',text:'Very Good product',user:'Vijay Singh',city:'Bilaspur',date:'4 months ago',helpful:546,unhelpful:167,verified:true},
                {rating:5,title:'Simply awesome',text:'Performance: very good processor handles every app smoothly.',user:'Parth Unadkat',city:'Navsari',date:'2 months ago',helpful:20,unhelpful:2,verified:true},
                {rating:5,title:'Just wow!',text:'Camera more than expected. Battery powerful. Design best.',user:'arvind chaudhary',city:'Gorakhpur',date:'4 months ago',helpful:593,unhelpful:196,verified:true},
                {rating:4,title:'Pretty good',text:'Seems ok. As of now everything is fine.',user:'Flipkart Customer',city:'Jaipur',date:'4 months ago',helpful:258,unhelpful:85,verified:true}
            ]
        }
    },
    {
        name: 'SAMSUNG Galaxy S25 5G (Navy, 256 GB)',
        brand: 'SAMSUNG', category: 'Mobiles',
        image_url: fkImg('j/e/r/-original-imah8pdgedd5whgs.jpeg'),
        price: 62999, original_price: 80999, discount: 22,
        description: 'SAMSUNG Galaxy S25 5G compact 6.2-inch flagship with Galaxy AI, Snapdragon 8 Elite, 50MP triple camera, 4000 mAh battery.',
        rating: 4.6, review_count: 2889,
        extras: {
            highlights: ['12 GB RAM | 256 GB ROM','Snapdragon 8 Elite | 4.47 GHz','50MP + 10MP + 12MP Rear Camera','6.2 inch Dynamic AMOLED 2X','4000 mAh Battery | 25W Fast Charge'],
            images: [fkImg('j/e/r/-original-imah8pdgedd5whgs.jpeg'),fkImg('2/b/8/-original-imah8pdgvxdznyes.jpeg'),fkImg('c/4/o/-original-imah8pdgzr3tqyhm.jpeg'),fkImg('u/l/v/-original-imah8pdgpjgyzhpx.jpeg'),fkImg('m/p/s/-original-imah8pdgc6vduxqv.jpeg'),fkImg('v/7/a/-original-imah8pdgzhyfdveh.jpeg')],
            color_variants: ['Navy','Silver Shadow','Mint','Icyblue'],
            ratings_breakdown: {'5':1878,'4':664,'3':202,'2':87,'1':58},
            specifications: [
                {group:'In The Box',items:[{label:'Sales Package',value:'Phone, USB Cable Type C-to-C, Quick Start Guide, SIM Ejector Pin'},{label:'Model Name',value:'Galaxy S25'},{label:'Color',value:'Navy'},{label:'SIM Type',value:'Dual Sim (Nano + eSIM)'}]},
                {group:'Display Features',items:[{label:'Display Size',value:'15.75 cm (6.2 inch)'},{label:'Resolution',value:'2340 x 1080 Pixels'},{label:'Display Type',value:'Dynamic AMOLED 2X'}]},
                {group:'OS & Processor',items:[{label:'Operating System',value:'Android 15, One UI 7'},{label:'Processor',value:'Snapdragon 8 Elite for Galaxy'},{label:'Core',value:'Octa Core'},{label:'Clock Speed',value:'4.47 GHz'}]},
                {group:'Memory & Storage',items:[{label:'RAM',value:'12 GB'},{label:'Internal Storage',value:'256 GB'}]},
                {group:'Camera',items:[{label:'Rear Camera',value:'50MP + 10MP + 12MP'},{label:'Front Camera',value:'12MP'},{label:'Video Recording',value:'8K @ 30fps, 4K @ 60fps'}]},
                {group:'Battery',items:[{label:'Battery Capacity',value:'4000 mAh'},{label:'Quick Charging',value:'25W Wired, 15W Wireless'}]},
                {group:'Warranty',items:[{label:'Warranty Summary',value:'1 Year Manufacturer Warranty'}]}
            ],
            reviews: [
                {rating:5,title:'Brilliant',text:'Amazing Camera, performance and software optimisation.',user:'frontech ecam',city:'Hyderabad',date:'1 year ago',helpful:858,unhelpful:256,verified:true},
                {rating:5,title:'Highly recommended',text:'Beyond Expectation. Top notch performance.',user:'Hari Krishnan',city:'Chennai',date:'1 year ago',helpful:612,unhelpful:188,verified:true},
                {rating:4,title:'Value-for-money',text:'Good phone, Camera is good. Price is slightly high.',user:'Raju Pattanayak',city:'Nashik',date:'1 year ago',helpful:97,unhelpful:34,verified:true}
            ]
        }
    },
    {
        name: 'Apple iPhone 15 (Black, 128 GB)',
        brand: 'Apple', category: 'Mobiles',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/h/d/9/-original-imagtc5fz9spysq5.jpeg?q=70&crop=false',
        price: 57999, original_price: 69900, discount: 17,
        description: 'iPhone 15 with Dynamic Island, A16 Bionic chip, 48MP camera system, USB-C, and all-day battery life.',
        rating: 4.6, review_count: 18234,
        extras: {
            highlights: ['128 GB ROM','A16 Bionic Chip','48MP + 12MP Dual Rear Camera','6.1 inch Super Retina XDR OLED','USB-C Connectivity','IP68 Water Resistant'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/h/d/9/-original-imagtc5fz9spysq5.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Best iPhone yet',text:'Camera quality is outstanding.',user:'Rajesh Kumar',city:'Mumbai',date:'3 months ago',helpful:342,unhelpful:45,verified:true},{rating:4,title:'Great phone',text:'Good phone but charging speed could be better.',user:'Amit Sharma',city:'Delhi',date:'5 months ago',helpful:156,unhelpful:67,verified:true}]
        }
    },
    {
        name: 'REDMI Note 13 Pro+ 5G (Fusion Purple, 256 GB)',
        brand: 'REDMI', category: 'Mobiles',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/2/s/l/-original-imagxqe8nng3fknh.jpeg?q=70&crop=false',
        price: 29999, original_price: 34999, discount: 14,
        description: 'Redmi Note 13 Pro+ 5G with 200MP OIS camera, Dimensity 7200 Ultra, 120W HyperCharge, 120Hz curved AMOLED.',
        rating: 4.3, review_count: 67892,
        extras: {
            highlights: ['12 GB RAM | 256 GB ROM','Dimensity 7200 Ultra','200MP + 8MP + 2MP Camera','6.67 inch 120Hz Curved AMOLED','5000 mAh | 120W HyperCharge'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/2/s/l/-original-imagxqe8nng3fknh.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Superb camera',text:'200MP camera is mind-blowing.',user:'Karthik R',city:'Bengaluru',date:'6 months ago',helpful:789,unhelpful:123,verified:true}]
        }
    },
    {
        name: 'realme GT 6T 5G (Razor Green, 128 GB)',
        brand: 'realme', category: 'Mobiles',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/m/o/b/-original-imah2dp3vhp9g2gf.jpeg?q=70&crop=false',
        price: 21999, original_price: 27999, discount: 21,
        description: 'realme GT 6T with Snapdragon 7+ Gen 3, 120Hz LTPO AMOLED, 5500mAh battery, 65W SUPERVOOC.',
        rating: 4.4, review_count: 23456,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','Snapdragon 7+ Gen 3','50MP Sony LYT-600 Camera','6.78 inch 120Hz LTPO AMOLED','5500 mAh | 65W SUPERVOOC'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/m/o/b/-original-imah2dp3vhp9g2gf.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Performance beast',text:'Snapdragon 7+ Gen 3 handles everything.',user:'Vikram Joshi',city:'Pune',date:'2 months ago',helpful:167,unhelpful:23,verified:true}]
        }
    },
    {
        name: 'OnePlus 12R (Iron Gray, 256 GB)',
        brand: 'OnePlus', category: 'Mobiles',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/3/5/l/-original-imagxqeghnh5hkzx.jpeg?q=70&crop=false',
        price: 37999, original_price: 42999, discount: 12,
        description: 'OnePlus 12R with Snapdragon 8 Gen 2, 100W SUPERVOOC, 5500mAh battery, 6.78 inch ProXDR Display.',
        rating: 4.5, review_count: 34567,
        extras: {
            highlights: ['16 GB RAM | 256 GB ROM','Snapdragon 8 Gen 2','50MP Sony IMX890 Camera','6.78 inch ProXDR AMOLED','5500 mAh | 100W SUPERVOOC'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/3/5/l/-original-imagxqeghnh5hkzx.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Flagship killer',text:'Incredible performance at this price point.',user:'Rohan Mehta',city:'Mumbai',date:'3 months ago',helpful:456,unhelpful:67,verified:true}]
        }
    },
    {
        name: 'vivo T3 5G (Crystal Flake, 128 GB)',
        brand: 'vivo', category: 'Mobiles',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/l/o/l/-original-imah2dp3yzxqbhgf.jpeg?q=70&crop=false',
        price: 17499, original_price: 19999, discount: 13,
        description: 'vivo T3 5G with Dimensity 7200, 50MP OIS camera, 5000mAh battery, 44W FlashCharge.',
        rating: 4.3, review_count: 28345,
        extras: {
            highlights: ['8 GB RAM | 128 GB ROM','Dimensity 7200','50MP OIS Camera','6.67 inch 120Hz AMOLED','5000 mAh | 44W FlashCharge'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/l/o/l/-original-imah2dp3yzxqbhgf.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Solid mid-ranger',text:'Great AMOLED display at this price.',user:'Suresh M',city:'Coimbatore',date:'2 months ago',helpful:112,unhelpful:18,verified:true}]
        }
    },

    // === ELECTRONICS ===
    {
        name: 'boAt Airdopes 141 TWS Earbuds (Bold Black)',
        brand: 'boAt', category: 'Electronics',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/headphone/v/i/5/-original-imaggaz2zhmnsfhh.jpeg?q=70&crop=false',
        price: 999, original_price: 4490, discount: 78,
        description: 'boAt Airdopes 141 with 42H playtime, ENx tech, IWP, IPX4, Bluetooth v5.3.',
        rating: 4.1, review_count: 245678,
        extras: {
            highlights: ['42 Hours Total Playtime','8mm Drivers','ENx Environmental Noise Cancellation','IPX4 Water Resistant','Bluetooth v5.3'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/headphone/v/i/5/-original-imaggaz2zhmnsfhh.jpeg?q=70&crop=false'],
            specifications: [{group:'General',items:[{label:'Brand',value:'boAt'},{label:'Model',value:'Airdopes 141'},{label:'Type',value:'True Wireless'}]},{group:'Features',items:[{label:'Battery Life',value:'42 Hours'},{label:'Bluetooth',value:'v5.3'},{label:'Water Resistant',value:'IPX4'}]}],
            reviews: [{rating:5,title:'Best budget earbuds',text:'Amazing sound quality at this price.',user:'Rahul Verma',city:'Delhi',date:'1 month ago',helpful:1234,unhelpful:234,verified:true}]
        }
    },
    {
        name: 'Sony WH-1000XM5 Wireless ANC Headphones (Black)',
        brand: 'Sony', category: 'Electronics',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/headphone/n/o/n/-original-imaghxegenrtz36t.jpeg?q=70&crop=false',
        price: 24990, original_price: 34990, discount: 29,
        description: 'Sony WH-1000XM5 with industry-leading noise cancellation, 30-hour battery, LDAC Hi-Res Audio.',
        rating: 4.5, review_count: 8765,
        extras: {
            highlights: ['Industry-leading ANC','30 Hours Battery Life','Hi-Res Audio (LDAC)','Multipoint Connection','Speak-to-Chat'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/headphone/n/o/n/-original-imaghxegenrtz36t.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'ANC king',text:'Best noise cancelling headphones money can buy.',user:'Siddharth Rao',city:'Bengaluru',date:'2 months ago',helpful:345,unhelpful:34,verified:true}]
        }
    },
    {
        name: 'JBL Flip 6 Portable Bluetooth Speaker (Blue)',
        brand: 'JBL', category: 'Electronics',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/speaker/mobile-tablet-speaker/u/v/n/-original-imaghxehdwewzqbh.jpeg?q=70&crop=false',
        price: 9999, original_price: 14999, discount: 33,
        description: 'JBL Flip 6 with powerful JBL Original Pro Sound, IP67 waterproof, 12 hours playtime.',
        rating: 4.5, review_count: 12345,
        extras: {
            highlights: ['JBL Original Pro Sound','IP67 Waterproof & Dustproof','12 Hours Battery Life','PartyBoost Compatible','USB-C Charging'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/speaker/mobile-tablet-speaker/u/v/n/-original-imaghxehdwewzqbh.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Powerful sound',text:'Amazing bass for its size.',user:'Arun Kumar',city:'Chennai',date:'1 month ago',helpful:234,unhelpful:23,verified:true}]
        }
    },
    {
        name: 'Samsung Galaxy Watch 6 Classic (Black, 47mm)',
        brand: 'SAMSUNG', category: 'Electronics',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/l/2/o/-original-imagrvx5kkttsugz.jpeg?q=70&crop=false',
        price: 25999, original_price: 37999, discount: 32,
        description: 'Samsung Galaxy Watch 6 Classic with rotating bezel, BioActive Sensor, Wear OS.',
        rating: 4.4, review_count: 5678,
        extras: {
            highlights: ['Rotating Bezel','BioActive Sensor','Wear OS by Google','Super AMOLED Display','GPS, NFC, Wi-Fi'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/l/2/o/-original-imagrvx5kkttsugz.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Premium smartwatch',text:'Rotating bezel is back! Health tracking is accurate.',user:'Deepak Kumar',city:'Hyderabad',date:'4 months ago',helpful:189,unhelpful:34,verified:true}]
        }
    },
    {
        name: 'Noise ColorFit Pro 5 Max Smartwatch (Jet Black)',
        brand: 'Noise', category: 'Electronics',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/n/z/p/-original-imah2dp3xzfgwghz.jpeg?q=70&crop=false',
        price: 3999, original_price: 8999, discount: 56,
        description: 'Noise ColorFit Pro 5 Max with 1.96 inch AMOLED display, Bluetooth calling.',
        rating: 4.1, review_count: 34567,
        extras: {
            highlights: ['1.96 inch AMOLED Display','Bluetooth Calling','100+ Sports Modes','7 Day Battery Life','IP68 Water Resistant'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/smartwatch/n/z/p/-original-imah2dp3xzfgwghz.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Great budget smartwatch',text:'Calling feature works well.',user:'Manish Kumar',city:'Patna',date:'1 month ago',helpful:234,unhelpful:45,verified:true}]
        }
    },

    // === LAPTOPS ===
    {
        name: 'HP Pavilion 15 (2024) Intel Core i5 12th Gen (16GB/512GB SSD)',
        brand: 'HP', category: 'Laptops',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/computer/q/k/t/-original-imaghxdrgrgzrcfg.jpeg?q=70&crop=false',
        price: 52990, original_price: 72312, discount: 27,
        description: 'HP Pavilion 15 with 12th Gen Intel Core i5, 16GB RAM, 512GB SSD, 15.6 inch FHD IPS.',
        rating: 4.3, review_count: 15678,
        extras: {
            highlights: ['Intel Core i5-1235U (12th Gen)','16 GB DDR4 RAM','512 GB SSD','15.6 inch Full HD IPS Display','Intel Iris Xe Graphics','Windows 11 Home'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/computer/q/k/t/-original-imaghxdrgrgzrcfg.jpeg?q=70&crop=false'],
            specifications: [{group:'General',items:[{label:'Brand',value:'HP'},{label:'Model',value:'Pavilion 15'},{label:'Processor',value:'Intel Core i5-1235U'}]},{group:'Display',items:[{label:'Screen Size',value:'15.6 inch'},{label:'Resolution',value:'1920 x 1080'}]},{group:'Memory',items:[{label:'RAM',value:'16 GB DDR4'},{label:'SSD',value:'512 GB'}]}],
            reviews: [{rating:5,title:'Great for work',text:'Smooth performance for office work.',user:'Sanjay Kumar',city:'Delhi',date:'2 months ago',helpful:456,unhelpful:67,verified:true}]
        }
    },
    {
        name: 'ASUS ROG Strix G16 (2024) Intel Core i7 13th Gen Gaming Laptop',
        brand: 'ASUS', category: 'Laptops',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/computer/t/b/i/-original-imah2dp3jf3hvbsy.jpeg?q=70&crop=false',
        price: 104990, original_price: 139990, discount: 25,
        description: 'ASUS ROG Strix G16 with Intel Core i7-13650HX, NVIDIA RTX 4060 8GB, 16GB DDR5, 1TB SSD.',
        rating: 4.5, review_count: 4567,
        extras: {
            highlights: ['Intel Core i7-13650HX','NVIDIA GeForce RTX 4060 8GB','16 GB DDR5 RAM','1 TB SSD','16 inch QHD+ 165Hz Display'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/computer/t/b/i/-original-imah2dp3jf3hvbsy.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Gaming beast',text:'RTX 4060 handles all AAA titles at high settings.',user:'Akash Verma',city:'Mumbai',date:'1 month ago',helpful:345,unhelpful:45,verified:true}]
        }
    },
    {
        name: 'Lenovo IdeaPad Slim 3 Intel Core i3 12th Gen (8GB/256GB)',
        brand: 'Lenovo', category: 'Laptops',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/computer/g/i/w/-original-imaghxdsd9khahtx.jpeg?q=70&crop=false',
        price: 29990, original_price: 46390, discount: 35,
        description: 'Lenovo IdeaPad Slim 3 with Intel Core i3, 8GB RAM, 256GB SSD, 15.6 inch FHD.',
        rating: 4.2, review_count: 23456,
        extras: {
            highlights: ['Intel Core i3-1215U','8 GB RAM','256 GB SSD','15.6 inch FHD Display','Windows 11'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/computer/g/i/w/-original-imaghxdsd9khahtx.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Best budget laptop',text:'Perfect for students and basic office work.',user:'Meena Devi',city:'Patna',date:'2 months ago',helpful:567,unhelpful:89,verified:true}]
        }
    },

    // === FASHION ===
    {
        name: "Levi's Men Regular Fit Mid Rise Blue Jeans",
        brand: "Levi's", category: 'Fashion',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/jean/z/i/k/32-18298-1189-levi-s-original-imah4yz7bpbz5pgx.jpeg?q=70&crop=false',
        price: 1799, original_price: 3599, discount: 50,
        description: "Levi's Men's 511 Slim Fit jeans in classic mid-rise blue wash.",
        rating: 4.2, review_count: 34567,
        extras: {
            highlights: ['Regular Fit','Mid Rise','Blue Wash','Cotton Blend','Machine Washable'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/jean/z/i/k/32-18298-1189-levi-s-original-imah4yz7bpbz5pgx.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Perfect fit',text:'Best jeans I have owned.',user:'Rahul Sharma',city:'Delhi',date:'1 month ago',helpful:234,unhelpful:34,verified:true}]
        }
    },
    {
        name: 'Nike Air Max 270 Running Shoes For Men (Black)',
        brand: 'Nike', category: 'Fashion',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/shoe/h/z/b/10-cd7337-003-nike-original-imaghxenz2zh5jw2.jpeg?q=70&crop=false',
        price: 11495, original_price: 15995, discount: 28,
        description: 'Nike Air Max 270 features the biggest heel Air unit for a super-soft ride.',
        rating: 4.4, review_count: 8765,
        extras: {
            highlights: ['Air Max 270 Heel Unit','Breathable Knit Upper','Rubber Outsole','Foam Midsole'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/shoe/h/z/b/10-cd7337-003-nike-original-imaghxenz2zh5jw2.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Super comfortable',text:'Best running shoes I have ever worn.',user:'Vikram Singh',city:'Mumbai',date:'1 month ago',helpful:345,unhelpful:45,verified:true}]
        }
    },
    {
        name: 'Allen Solly Men Printed Cotton Casual Shirt',
        brand: 'Allen Solly', category: 'Fashion',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/shirt/b/t/x/m-assfqmofl57413-allen-solly-original-imah4yz3gfzqygkw.jpeg?q=70&crop=false',
        price: 999, original_price: 2499, discount: 60,
        description: "Allen Solly Men's casual printed shirt in premium cotton fabric.",
        rating: 4.1, review_count: 12345,
        extras: {
            highlights: ['100% Cotton','Printed Pattern','Regular Fit','Full Sleeve','Machine Washable'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/shirt/b/t/x/m-assfqmofl57413-allen-solly-original-imah4yz3gfzqygkw.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good casual shirt',text:'Nice fabric, good print quality.',user:'Aditya Raj',city:'Bengaluru',date:'2 months ago',helpful:123,unhelpful:23,verified:true}]
        }
    },
    {
        name: 'Fossil Grant Chronograph Leather Watch for Men',
        brand: 'Fossil', category: 'Fashion',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/watch/g/s/l/-original-imaghxenfbyrxhjn.jpeg?q=70&crop=false',
        price: 8495, original_price: 12995, discount: 35,
        description: 'Fossil Grant Chronograph with genuine leather strap, 44mm stainless steel case.',
        rating: 4.3, review_count: 5678,
        extras: {
            highlights: ['Chronograph Movement','Genuine Leather Strap','44mm Case Size','Mineral Crystal Glass','Water Resistant 50m'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/watch/g/s/l/-original-imaghxenfbyrxhjn.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Elegant timepiece',text:'Looks premium. Leather strap quality is excellent.',user:'Nikhil Jain',city:'Pune',date:'1 month ago',helpful:189,unhelpful:23,verified:true}]
        }
    },

    // === HOME APPLIANCES ===
    {
        name: 'Samsung 253L 3 Star Frost Free Double Door Refrigerator',
        brand: 'SAMSUNG', category: 'Home Appliances',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/refrigerator-new/v/j/l/-original-imaghxdzdzzjyyhf.jpeg?q=70&crop=false',
        price: 24990, original_price: 33490, discount: 25,
        description: 'Samsung 253L Double Door Refrigerator with Digital Inverter Technology, Twin Cooling Plus.',
        rating: 4.3, review_count: 45678,
        extras: {
            highlights: ['253 Litres Capacity','Digital Inverter Technology','Twin Cooling Plus','All-Around Cooling','3 Star Energy Rating'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/refrigerator-new/v/j/l/-original-imaghxdzdzzjyyhf.jpeg?q=70&crop=false'],
            specifications: [{group:'General',items:[{label:'Brand',value:'Samsung'},{label:'Capacity',value:'253 Litres'},{label:'Type',value:'Frost Free Double Door'}]},{group:'Warranty',items:[{label:'Product Warranty',value:'1 Year'},{label:'Compressor Warranty',value:'20 Years'}]}],
            reviews: [{rating:5,title:'Silent operation',text:'Very quiet. Cooling is uniform.',user:'Ravi Shankar',city:'Hyderabad',date:'2 months ago',helpful:456,unhelpful:67,verified:true}]
        }
    },
    {
        name: 'LG 7 Kg 5 Star Fully Automatic Top Load Washing Machine',
        brand: 'LG', category: 'Home Appliances',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/washing-machine-new/p/h/c/-original-imaghxe6jqhfrgze.jpeg?q=70&crop=false',
        price: 17490, original_price: 24990, discount: 30,
        description: 'LG 7 Kg Fully Automatic Top Load Washing Machine with Smart Inverter Technology.',
        rating: 4.4, review_count: 34567,
        extras: {
            highlights: ['7 Kg Capacity','Smart Inverter Technology','TurboDrum','Auto Restart','5 Star Energy Rating'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/washing-machine-new/p/h/c/-original-imaghxe6jqhfrgze.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Excellent washer',text:'Cleans clothes thoroughly.',user:'Kavitha R',city:'Chennai',date:'1 month ago',helpful:345,unhelpful:45,verified:true}]
        }
    },
    {
        name: 'Crompton Energion Hyperjet 1200mm Ceiling Fan (Brown)',
        brand: 'Crompton', category: 'Home Appliances',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/fan/8/d/m/-original-imaghxe5nwphzqjx.jpeg?q=70&crop=false',
        price: 1599, original_price: 2800, discount: 43,
        description: 'Crompton Energion Hyperjet 1200mm Ceiling Fan with Energy Efficient Motor.',
        rating: 4.2, review_count: 56789,
        extras: {
            highlights: ['1200mm Sweep','Energy Efficient Motor','High Air Delivery','Low Noise Operation','2 Year Warranty'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/fan/8/d/m/-original-imaghxe5nwphzqjx.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good airflow',text:'Decent fan for the price.',user:'Manoj Kumar',city:'Delhi',date:'3 months ago',helpful:234,unhelpful:45,verified:true}]
        }
    },

    // === TELEVISIONS ===
    {
        name: 'Samsung 108 cm (43 inch) Crystal 4K Ultra HD Smart LED TV',
        brand: 'SAMSUNG', category: 'Televisions',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/television/j/g/p/-original-imaghxe4sgqw2gdq.jpeg?q=70&crop=false',
        price: 27990, original_price: 47900, discount: 42,
        description: 'Samsung 43 inch Crystal 4K UHD Smart TV with Crystal Processor 4K, HDR, Tizen OS.',
        rating: 4.3, review_count: 67890,
        extras: {
            highlights: ['43 inch Crystal 4K Display','Crystal Processor 4K','HDR','Smart TV (Tizen OS)','20W Speaker Output'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/television/j/g/p/-original-imaghxe4sgqw2gdq.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Stunning picture',text:'Crystal clear 4K display. Colors are vibrant.',user:'Arjun Nair',city:'Kochi',date:'2 months ago',helpful:567,unhelpful:89,verified:true}]
        }
    },
    {
        name: 'LG 139 cm (55 inch) OLED 4K Ultra HD Smart WebOS TV',
        brand: 'LG', category: 'Televisions',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/television/s/8/q/-original-imagrvx5frwxjhys.jpeg?q=70&crop=false',
        price: 89990, original_price: 139990, discount: 36,
        description: 'LG 55 inch OLED 4K TV with self-lit OLED pixels, a9 Gen6 AI Processor, Dolby Vision & Atmos.',
        rating: 4.6, review_count: 4567,
        extras: {
            highlights: ['55 inch OLED 4K Display','Self-lit OLED Pixels','a9 Gen6 AI Processor','Dolby Vision & Dolby Atmos','WebOS Smart TV'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/television/s/8/q/-original-imagrvx5frwxjhys.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'OLED is unmatched',text:'Infinite contrast ratio. Perfect blacks.',user:'Ashwin R',city:'Mumbai',date:'1 month ago',helpful:234,unhelpful:23,verified:true}]
        }
    },

    // === KITCHEN APPLIANCES ===
    {
        name: 'Prestige Iris 750W Mixer Grinder (3 Jars)',
        brand: 'Prestige', category: 'Kitchen Appliances',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mixer-grinder-juicer/z/e/g/-original-imaghxe5uyzywhwv.jpeg?q=70&crop=false',
        price: 2499, original_price: 4995, discount: 50,
        description: 'Prestige Iris 750W Mixer Grinder with 3 stainless steel jars.',
        rating: 4.2, review_count: 23456,
        extras: {
            highlights: ['750 Watt Motor','3 Stainless Steel Jars','Super Efficient Motor','Leak-proof Lids','2 Year Warranty'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mixer-grinder-juicer/z/e/g/-original-imaghxe5uyzywhwv.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Powerful grinder',text:'Grinds everything smoothly.',user:'Lakshmi Devi',city:'Chennai',date:'2 months ago',helpful:345,unhelpful:45,verified:true}]
        }
    },
    {
        name: 'Bajaj Majesty New SWX 4 800W Sandwich Maker',
        brand: 'Bajaj', category: 'Kitchen Appliances',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/sandwich-maker/d/j/f/-original-imaghxe4gzbxghfy.jpeg?q=70&crop=false',
        price: 1299, original_price: 1995, discount: 35,
        description: 'Bajaj Majesty SWX 4 sandwich maker with non-stick coating.',
        rating: 4.1, review_count: 15678,
        extras: {
            highlights: ['800W Power','Non-Stick Coating','Heat Resistant Handles','LED Indicator','Compact Design'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/sandwich-maker/d/j/f/-original-imaghxe4gzbxghfy.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good sandwich maker',text:'Makes perfect sandwiches.',user:'Sneha Gupta',city:'Lucknow',date:'1 month ago',helpful:123,unhelpful:23,verified:true}]
        }
    },

    // === FURNITURE ===
    {
        name: 'Wakefit Orthopaedic Memory Foam Mattress (Queen, 6 inch)',
        brand: 'Wakefit', category: 'Furniture',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/bed-mattress/g/f/z/-original-imaghxe6grp7bnxn.jpeg?q=70&crop=false',
        price: 7999, original_price: 15639, discount: 49,
        description: 'Wakefit Orthopaedic Memory Foam Mattress with zero partner disturbance.',
        rating: 4.3, review_count: 89012,
        extras: {
            highlights: ['Queen Size (72x60 inches)','6 inch Thickness','Memory Foam','Zero Partner Disturbance','10 Year Warranty'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/bed-mattress/g/f/z/-original-imaghxe6grp7bnxn.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Best sleep ever',text:'Body pain has reduced significantly.',user:'Priya Verma',city:'Delhi',date:'1 month ago',helpful:678,unhelpful:89,verified:true}]
        }
    },
    {
        name: 'Solimo Engineered Wood Study Table (Walnut)',
        brand: 'Solimo', category: 'Furniture',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/office-study-table/t/j/x/-original-imaghxe4zvsfhgnj.jpeg?q=70&crop=false',
        price: 3499, original_price: 7999, discount: 56,
        description: 'Solimo engineered wood study table with drawer storage.',
        rating: 4.0, review_count: 12345,
        extras: {
            highlights: ['Engineered Wood','Drawer Storage','Cable Management','Scratch Resistant','Easy Assembly'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/office-study-table/t/j/x/-original-imaghxe4zvsfhgnj.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good desk for WFH',text:'Sturdy construction. Assembly was easy.',user:'Deepak Sharma',city:'Bengaluru',date:'2 months ago',helpful:234,unhelpful:45,verified:true}]
        }
    },

    // === BEAUTY ===
    {
        name: 'Maybelline Fit Me Matte+Poreless Foundation (220)',
        brand: 'Maybelline', category: 'Beauty',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/foundation/z/w/i/-original-imaghxe5k2xyzghn.jpeg?q=70&crop=false',
        price: 399, original_price: 575, discount: 31,
        description: 'Maybelline Fit Me Matte+Poreless liquid foundation for a natural matte finish.',
        rating: 4.2, review_count: 156789,
        extras: {
            highlights: ['Matte + Poreless Finish','Micro-powders Technology','Oil-Free Formula','SPF 22','Dermatologist Tested'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/foundation/z/w/i/-original-imaghxe5k2xyzghn.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Best drugstore foundation',text:'Amazing coverage. Stays matte all day.',user:'Priyanka Das',city:'Kolkata',date:'1 month ago',helpful:789,unhelpful:123,verified:true}]
        }
    },

    // === PERSONAL CARE ===
    {
        name: 'Philips BT1233/14 Beard Trimmer For Men',
        brand: 'Philips', category: 'Personal Care',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/trimmer/y/c/k/-original-imaghxe4jywhzghn.jpeg?q=70&crop=false',
        price: 999, original_price: 1495, discount: 33,
        description: 'Philips USB charging beard trimmer with DuraPower technology.',
        rating: 4.1, review_count: 78901,
        extras: {
            highlights: ['USB Charging','DuraPower Technology','Skin-Friendly Blades','60 min Runtime','2 Year Warranty'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/trimmer/y/c/k/-original-imaghxe4jywhzghn.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good trimmer',text:'USB charging is convenient.',user:'Akshay Kumar',city:'Pune',date:'1 month ago',helpful:456,unhelpful:67,verified:true}]
        }
    },

    // === SPORTS & FITNESS ===
    {
        name: 'Boldfit Yoga Mat (6mm, Anti-Skid)',
        brand: 'Boldfit', category: 'Sports & Fitness',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/mat/r/c/h/-original-imaghxe5hgny7qzf.jpeg?q=70&crop=false',
        price: 399, original_price: 1999, discount: 80,
        description: 'Boldfit Premium Yoga Mat with anti-skid surface, 6mm thickness.',
        rating: 4.0, review_count: 45678,
        extras: {
            highlights: ['6mm Thickness','Anti-Skid Surface','Lightweight & Portable','Moisture Resistant','Carrying Strap'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/mat/r/c/h/-original-imaghxe5hgny7qzf.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good for beginners',text:'Good grip. Thickness is just right.',user:'Ananya Reddy',city:'Hyderabad',date:'2 months ago',helpful:234,unhelpful:45,verified:true}]
        }
    },
    {
        name: 'Nivia Storm Football (Size 5)',
        brand: 'Nivia', category: 'Sports & Fitness',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/ball/x/h/a/-original-imaghxe5dfzajwvh.jpeg?q=70&crop=false',
        price: 549, original_price: 990, discount: 45,
        description: 'Nivia Storm Football with rubberized moulded construction.',
        rating: 4.1, review_count: 23456,
        extras: {
            highlights: ['Size 5','Rubberized Moulded','Machine Stitched','All Surface','Good Air Retention'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/ball/x/h/a/-original-imaghxe5dfzajwvh.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good quality ball',text:'Nice grip and bounce.',user:'Sunil Kumar',city:'Delhi',date:'3 months ago',helpful:123,unhelpful:23,verified:true}]
        }
    },

    // === BOOKS ===
    {
        name: 'Atomic Habits by James Clear (Paperback)',
        brand: 'Penguin', category: 'Books',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/book/c/1/l/-original-imaghxe4pvjzzfgz.jpeg?q=70&crop=false',
        price: 399, original_price: 799, discount: 50,
        description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
        rating: 4.6, review_count: 123456,
        extras: {
            highlights: ['Paperback','320 Pages','English','International Bestseller','Self-Help'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/book/c/1/l/-original-imaghxe4pvjzzfgz.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Life changing book',text:'Best book on habit formation.',user:'Rahul Verma',city:'Delhi',date:'1 month ago',helpful:1234,unhelpful:123,verified:true}]
        }
    },
    {
        name: 'Rich Dad Poor Dad by Robert T. Kiyosaki (Paperback)',
        brand: 'Plata Publishing', category: 'Books',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/book/o/y/n/-original-imaghxe4bxjfhmzf.jpeg?q=70&crop=false',
        price: 299, original_price: 599, discount: 50,
        description: 'What the Rich Teach Their Kids About Money.',
        rating: 4.5, review_count: 98765,
        extras: {
            highlights: ['Paperback','336 Pages','English','All-time Bestseller','Personal Finance'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/book/o/y/n/-original-imaghxe4bxjfhmzf.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Financial literacy starter',text:'Great introduction to financial thinking.',user:'Karthik M',city:'Bengaluru',date:'1 month ago',helpful:456,unhelpful:56,verified:true}]
        }
    },

    // === TOYS & GAMES ===
    {
        name: 'LEGO Classic Medium Creative Brick Box (484 Pieces)',
        brand: 'LEGO', category: 'Toys & Games',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/block-construction-toy/o/x/z/-original-imaghxe5ckmptzqh.jpeg?q=70&crop=false',
        price: 2499, original_price: 3999, discount: 38,
        description: 'LEGO Classic Creative Brick Box with 484 pieces in 35 colors.',
        rating: 4.5, review_count: 12345,
        extras: {
            highlights: ['484 Pieces','35 Different Colors','Includes Baseplate','Ages 4+','Storage Box Included'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/block-construction-toy/o/x/z/-original-imaghxe5ckmptzqh.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Kids love it',text:'My kids play with it every day.',user:'Meera Sharma',city:'Noida',date:'1 month ago',helpful:234,unhelpful:23,verified:true}]
        }
    },

    // === GROCERY ===
    {
        name: 'Tata Sampann Pure Turmeric Powder (500g)',
        brand: 'Tata Sampann', category: 'Grocery',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/spice-masala/j/b/b/-original-imaghxe5xnhzwghq.jpeg?q=70&crop=false',
        price: 129, original_price: 162, discount: 20,
        description: 'Tata Sampann Pure Turmeric Powder with high curcumin content.',
        rating: 4.4, review_count: 34567,
        extras: {
            highlights: ['100% Pure Turmeric','High Curcumin','No Added Colors','500g Pack'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/spice-masala/j/b/b/-original-imaghxe5xnhzwghq.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Pure quality',text:'Genuine turmeric. Rich color and aroma.',user:'Lakshmi Amma',city:'Kochi',date:'1 month ago',helpful:123,unhelpful:12,verified:true}]
        }
    },

    // === GAMING ===
    {
        name: 'Sony PlayStation 5 825 GB (Disc Edition)',
        brand: 'Sony', category: 'Gaming',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/gamingconsole/w/r/s/-original-imaghxe4zbhgfxyz.jpeg?q=70&crop=false',
        price: 49990, original_price: 54990, discount: 9,
        description: 'Sony PS5 Console with 825GB SSD, Ray Tracing, 4K Gaming, Haptic Feedback.',
        rating: 4.7, review_count: 8765,
        extras: {
            highlights: ['825 GB SSD','Ray Tracing','4K Gaming at 120fps','DualSense Controller','Tempest 3D AudioTech'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/gamingconsole/w/r/s/-original-imaghxe4zbhgfxyz.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Next-gen gaming',text:'Load times are incredible. DualSense is game-changing.',user:'Rohit Sharma',city:'Mumbai',date:'2 months ago',helpful:567,unhelpful:45,verified:true}]
        }
    },

    // === SMART HOME ===
    {
        name: 'Amazon Echo Dot (5th Gen) Smart Speaker with Alexa (Blue)',
        brand: 'Amazon', category: 'Smart Home',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/speaker/mobile-tablet-speaker/p/t/z/-original-imaghxe6bnzygxhj.jpeg?q=70&crop=false',
        price: 4499, original_price: 5499, discount: 18,
        description: 'Amazon Echo Dot 5th Gen with improved speaker quality, temperature sensor, Alexa.',
        rating: 4.3, review_count: 34567,
        extras: {
            highlights: ['Improved Sound Quality','Temperature Sensor','Alexa Voice Assistant','Smart Home Hub','Bluetooth'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/speaker/mobile-tablet-speaker/p/t/z/-original-imaghxe6bnzygxhj.jpeg?q=70&crop=false'],
            reviews: [{rating:5,title:'Love Alexa',text:'Great smart speaker.',user:'Anjali Mehta',city:'Pune',date:'1 month ago',helpful:234,unhelpful:34,verified:true}]
        }
    },

    // === TRAVEL ===
    {
        name: 'American Tourister Ivy 68cm Check-in Luggage (Blue)',
        brand: 'American Tourister', category: 'Travel',
        image_url: 'https://rukminim2.flixcart.com/image/832/832/xif0q/suitcase/h/a/f/-original-imaghxe5gqnzyyaf.jpeg?q=70&crop=false',
        price: 3499, original_price: 8400, discount: 58,
        description: 'American Tourister Ivy 68cm polycarbonate hard-side check-in luggage.',
        rating: 4.2, review_count: 23456,
        extras: {
            highlights: ['68 cm Medium Size','Polycarbonate','Combination Lock','360 Spinner Wheels','3 Year Warranty'],
            images: ['https://rukminim2.flixcart.com/image/832/832/xif0q/suitcase/h/a/f/-original-imaghxe5gqnzyyaf.jpeg?q=70&crop=false'],
            reviews: [{rating:4,title:'Good luggage',text:'Sturdy build. Wheels are smooth.',user:'Vinay Kumar',city:'Hyderabad',date:'2 months ago',helpful:345,unhelpful:45,verified:true}]
        }
    }
];

function generateSlug(tgId) {
    return 'shop-' + crypto.createHash('md5').update(String(tgId)).digest('hex').slice(0, 8);
}

function buildReviewsField(p) {
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

const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

// Various locations for testing the radius filter
// Assuming the user is testing from somewhere in Maharashtra (e.g., Pune coordinates: 18.5204, 73.8567)
const LOCATIONS = [
    { name: 'Pune (Nearby)', lat: 18.5204, lng: 73.8567 }, // ~0km
    { name: 'Mumbai (Far)', lat: 19.0760, lng: 72.8777 }, // ~120km
    { name: 'Nashik (Far)', lat: 20.0059, lng: 73.7903 }, // ~165km
    { name: 'Nagpur (Very Far)', lat: 21.1458, lng: 79.0882 }, // ~570km
    { name: 'Pimpri-Chinchwad (Nearby)', lat: 18.6298, lng: 73.7997 }, // ~15km
    { name: 'Kothrud, Pune (Nearby)', lat: 18.5074, lng: 73.8077 }, // ~5km
];

const DUMMY_PRODUCTS = [
    {
        name: 'Fresh Organic Tomatoes',
        category: 'Vegetables',
        price: 40,
        unit: 'kg',
        quantity: 50,
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
        description: 'Freshly picked organic red tomatoes straight from our local farm.',
        isAuction: false,
    },
    {
        name: 'Alphonso Mangoes',
        category: 'Fruits',
        price: 800,
        unit: 'dozen',
        quantity: 20,
        image: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&q=80',
        description: 'Premium export quality Alphonso mangoes. Sweet and pulpy.',
        isAuction: true,
        basePrice: 600,
        auctionDurationDays: 3,
    },
    {
        name: 'Basmati Rice',
        category: 'Grains',
        price: 110,
        unit: 'kg',
        quantity: 500,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&q=80',
        description: 'Aromatic long-grain Basmati rice. Aged for 2 years.',
        isAuction: false,
    },
    {
        name: 'Sugarcane Bagasse',
        category: 'Agri Waste',
        price: 5,
        unit: 'tons',
        quantity: 100,
        image: 'https://images.unsplash.com/photo-1596489397666-6b2158867a54?w=500&q=80',
        description: 'Dry sugarcane bagasse perfect for biofuel or paper industry.',
        isAuction: true,
        isAgriWaste: true,
        basePrice: 5,
        auctionDurationDays: 5,
    },
    {
        name: 'Fresh Green Peas',
        category: 'Vegetables',
        price: 60,
        unit: 'kg',
        quantity: 100,
        image: 'https://images.unsplash.com/photo-1518568740560-333139a27f72?w=500&q=80',
        description: 'Sweet and tender green peas, organically grown.',
        isAuction: false,
    },
    {
        name: 'Wheat Straw',
        category: 'Agri Waste',
        price: 8,
        unit: 'tons',
        quantity: 50,
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&q=80',
        description: 'Dry wheat straw for cattle feed or packaging.',
        isAuction: true,
        isAgriWaste: true,
        basePrice: 6,
        auctionDurationDays: 7,
    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        // Find a farmer to assign products to
        const farmer = await User.findOne({ role: 'farmer' });
        if (!farmer) {
            console.error('No farmer user found in DB. Please register at least one farmer first.');
            process.exit(1);
        }

        console.log(`Using farmer: ${farmer.email}`);

        let totalAdded = 0;

        for (let i = 0; i < DUMMY_PRODUCTS.length; i++) {
            const dp = DUMMY_PRODUCTS[i];
            const loc = LOCATIONS[i % LOCATIONS.length]; // Cycle through locations

            const productData = {
                farmer: farmer._id,
                name: dp.name,
                category: dp.category,
                price: dp.price,
                unit: dp.unit,
                quantity: dp.quantity,
                image: dp.image,
                description: `${dp.description} (Location: ${loc.name})`,
                isAuction: dp.isAuction,
                isAgriWaste: dp.isAgriWaste || false,
                location: {
                    latitude: loc.lat,
                    longitude: loc.lng
                }
            };

            if (dp.isAuction) {
                productData.basePrice = dp.basePrice;
                productData.highestBid = 0;
                productData.auctionEndTime = new Date(Date.now() + dp.auctionDurationDays * 24 * 60 * 60 * 1000);
            }

            const newProduct = new Product(productData);
            await newProduct.save();
            console.log(`Added: ${dp.name} at ${loc.name}`);
            totalAdded++;
        }

        console.log(`Success! Added ${totalAdded} dummy products with various locations.`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Get the argument from the command line ('near' or 'far')
const mode = process.argv[2];

const LOCATIONS = {
    near: { name: 'Pune (0km - 15km)', lat: 18.5204, lng: 73.8567 },
    far: { name: 'Delhi (> 1000km)', lat: 28.7041, lng: 77.1025 },
};

if (!mode || !LOCATIONS[mode]) {
    console.log("-----------------------------------------");
    console.log("❌ Please specify 'near' or 'far'");
    console.log("👉 Run: node demo_location.js near");
    console.log("👉 Run: node demo_location.js far");
    console.log("-----------------------------------------");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log(`🔄 Moving all products to ${LOCATIONS[mode].name}...`);

        await Product.updateMany({}, {
            $set: {
                "location.latitude": LOCATIONS[mode].lat,
                "location.longitude": LOCATIONS[mode].lng
            }
        });

        console.log(`✅ Database Updated! All products are now '${mode.toUpperCase()}'.`);
        console.log("📱 Pull-to-refresh your Buyer app to see the instant changes!");
        process.exit(0);
    })
    .catch(err => {
        console.error('Database Error:', err);
        process.exit(1);
    });

const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const products = await Product.find({ "location.latitude": { $exists: false } });
        console.log(`Found ${products.length} products without location.`);

        for (let p of products) {
            // Assign a far away origin (e.g., Delhi coordinates -> ~1100km from Maharashtra)
            p.location = {
                latitude: 28.7041,
                longitude: 77.1025
            };
            await p.save();
        }
        console.log('Done updating legacy products with far-away locations for testing.');
        process.exit();
    })
    .catch(console.error);




// node demo_location.js near
//node demo_location.js far

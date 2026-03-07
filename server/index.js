require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Farm Marketplace API Running');
});

// Define Routes
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/bids', require('./routes/bids'));

// Database Connection (local MongoDB - viewable via MongoDB Compass)
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
})
    .then(() => console.log(`MongoDB connected: ${process.env.MONGO_URI}`))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.error('Make sure MongoDB is running locally (mongod) and MongoDB Compass can connect to mongodb://localhost:27017');
        process.exit(1);
    });

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

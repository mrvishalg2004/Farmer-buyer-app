const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @route   POST /products
// @desc    Add a new product
// @access  Private (Farmer only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    const { name, category, price, unit, quantity, image, description, isAuction, basePrice, auctionEndTime, isAgriWaste } = req.body;

    if (!name || !category || !price || !unit || !quantity) {
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        const newProduct = new Product({
            farmer: req.user.id,
            name,
            category,
            price,
            unit,
            quantity,
            quantity,
            image,
            description,
            isAuction,
            basePrice,
            auctionEndTime,
            isAgriWaste: isAgriWaste || false,
            highestBid: isAuction ? 0 : undefined
        });

        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /products/my
// @desc    Get all products of logged-in farmer
// @access  Private (Farmer only)
router.get('/my', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    try {
        const query = { farmer: req.user.id };
        if (req.query.isAgriWaste === 'true') {
            query.isAgriWaste = true;
        } else {
            query.isAgriWaste = { $ne: true };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /products/:id
// @desc    Update a product
// @access  Private (Farmer only)
router.put('/:id', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    const { name, category, price, unit, quantity, image, description } = req.body;

    // Build product object
    const productFields = {};
    if (name) productFields.name = name;
    if (category) productFields.category = category;
    if (price) productFields.price = price;
    if (unit) productFields.unit = unit;
    if (quantity) productFields.quantity = quantity;
    if (image) productFields.image = image;
    if (description) productFields.description = description;

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Make sure user owns product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productFields },
            { new: true }
        );

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /products/:id
// @desc    Delete a product
// @access  Private (Farmer only)
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Make sure user owns product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({ message: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /products
// @desc    Get all products (Buyer view with filtering)
// @access  Public (or Private)
router.get('/', async (req, res) => {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'All') {
        query.category = category;
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    if (req.query.isAgriWaste === 'true') {
        query.isAgriWaste = true;
    } else {
        query.isAgriWaste = { $ne: true };
    }

    try {
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;

// @route   POST /products/:id/bid
// @desc    Place a bid on a product
// @access  Private (Buyer)
router.post('/:id/bid', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (!product.isAuction) {
            return res.status(400).json({ message: 'This product is not for auction' });
        }

        if (new Date() > new Date(product.auctionEndTime)) {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        const { amount } = req.body;
        if (!amount || amount <= product.highestBid || amount <= product.basePrice) {
            return res.status(400).json({ message: 'Bid must be higher than current highest bid and base price' });
        }

        const newBid = {
            user: req.user.id,
            amount,
            time: Date.now()
        };

        product.bids.push(newBid);
        product.highestBid = amount;
        product.highestBidderId = req.user.id; // Track the highest bidder

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /products/:id/accept-bid
// @desc    Accept a bid and convert to order
// @access  Private (Farmer only)
router.post('/:id/accept-bid', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { bidId } = req.body;
        const bid = product.bids.id(bidId);

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Create Order
        const newOrder = new Order({
            user: bid.user,
            items: [{
                product: product._id,
                name: product.name,
                price: bid.amount,
                quantity: product.quantity // Assuming selling all quantity in auction
            }],
            totalAmount: bid.amount, // Total amount is the bid amount
            paymentId: 'AUCTION_' + Date.now(), // Placeholder
            status: 'pending'
        });

        await newOrder.save();

        // Optional: Mark product as sold or decrease quantity
        // product.quantity = 0;
        // await product.save();

        res.json({ message: 'Bid accepted, order created', order: newOrder });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// @route   POST /products/:id/auction
// @desc    Enable auction mode for a product (Feature 1 Strict)
// @access  Private (Farmer only)
router.post('/:id/auction', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. Only the owner can start an auction.' });
        }

        if (product.auctionStatus === 'CLOSED' || product.auctionStatus === 'SOLD') {
            return res.status(400).json({ message: 'This auction is already closed or sold.' });
        }

        const { basePrice, minBidIncrement, auctionStartTime, auctionEndTime } = req.body;

        if (!basePrice || !auctionStartTime || !auctionEndTime) {
            return res.status(400).json({ message: 'Please provide basePrice, auctionStartTime, and auctionEndTime.' });
        }

        const start = new Date(auctionStartTime);
        const end = new Date(auctionEndTime);

        if (end <= start) {
            return res.status(400).json({ message: 'Auction end time must be after start time.' });
        }

        product.isAuction = true;
        product.basePrice = basePrice;
        product.minBidIncrement = minBidIncrement || 0;
        product.auctionStartTime = start;
        product.auctionEndTime = end;
        product.auctionStatus = 'OPEN';

        // Reset highest bid if restarting/configuring
        // product.highestBid = 0; 
        // product.highestBidderId = undefined;

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /products/:id/quantity
// @desc    Update product quantity
// @access  Private (Farmer only)
router.patch('/:id/quantity', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    const { quantity } = req.body;

    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: 'Please provide a valid non-negative quantity' });
    }

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        // Make sure user owns product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        product.quantity = quantity;
        await product.save();

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// @route   POST /products
// @desc    Add a new product
// @access  Private (Farmer only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    const { name, category, price, unit, quantity, image, description } = req.body;

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
            image,
            description
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
        const products = await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 });
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
// @desc    Get all products (Buyer view)
// @access  Public (or Private)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

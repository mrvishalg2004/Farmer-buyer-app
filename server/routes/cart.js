const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @route   GET /cart
// @desc    Get current user's cart
// @access  Private (Buyer)
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Access denied. Buyers only.' });
    }

    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
            await cart.save();
        }
        res.json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /cart
// @desc    Add item to cart or update quantity
// @access  Private (Buyer)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Access denied. Buyers only.' });
    }

    const { productId, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        // Check if product exists in cart
        const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

        if (itemIndex > -1) {
            // Product exists in cart, update quantity
            cart.items[itemIndex].quantity = quantity;
            // If quantity <= 0, remove item
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        } else {
            // Product does not exist in cart, add new item
            if (quantity > 0) {
                cart.items.push({ product: productId, quantity });
            }
        }

        cart.updatedAt = Date.now();
        await cart.save();

        // Populate and return
        cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        res.json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /cart/:productId
// @desc    Remove item from cart
// @access  Private (Buyer)
router.delete('/:productId', auth, async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Access denied. Buyers only.' });
    }

    try {
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(p => p.product.toString() === req.params.productId);
        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
        }

        cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        res.json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

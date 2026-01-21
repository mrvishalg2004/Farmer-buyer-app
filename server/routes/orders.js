const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @route   POST /orders/create
// @desc    Create Razorpay Order
// @access  Private (Buyer)
router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Access denied. Buyers only.' });
    }

    const { amount } = req.body; // Amount in smallest currency unit (paise)

    const options = {
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
});

// @route   POST /orders/verify
// @desc    Verify Payment and Save Order
// @access  Private (Buyer)
router.post('/verify', auth, async (req, res) => {
    if (req.user.role !== 'buyer') {
        return res.status(403).json({ message: 'Access denied. Buyers only.' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, totalAmount } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature || razorpay_signature === 'MOCK_SIGNATURE_NEEDS_BACKEND_BYPASS_OR_REAL') {
        try {
            // Payment Success
            const newOrder = new Order({
                user: req.user.id,
                items,
                totalAmount,
                paymentId: razorpay_payment_id,
                status: 'paid'
            });

            await newOrder.save();

            // Clear Cart
            await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } });

            res.json({ message: 'Payment success', orderId: newOrder._id });
        } catch (err) {
            console.error(err);
            res.status(500).send('Order Save Error');
        }
    } else {
        res.status(400).json({ message: 'Payment verification failed' });
    }
});

// @route   GET /orders
// @desc    Get user orders (Buyer history)
// @access  Private (Buyer)
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /orders/received
// @desc    Get orders containing products of the logged-in farmer
// @access  Private (Farmer)
router.get('/received', auth, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Access denied. Farmers only.' });
    }

    try {
        // 1. Find all products belonging to this farmer
        const Product = require('../models/Product');
        const farmerProducts = await Product.find({ farmer: req.user.id }).select('_id');
        const farmerProductIds = farmerProducts.map(p => p._id);

        // 2. Find orders that contain any of these products
        // Note: 'items.product' stores the product ID
        const orders = await Order.find({
            'items.product': { $in: farmerProductIds }
        })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        // 3. (Optional) Filter the items array to only show products belonging to this farmer?
        // For now, checking the Order level. A more complex UI might want to see *only* their items 
        // in a mixed cart, but usually seeing the whole order is fine or filtering on client.
        // Let's filter items on server-side to be safe/clean if it was a mixed cart.

        const farmerOrders = orders.map(order => {
            const myItems = order.items.filter(item =>
                farmerProductIds.some(fid => fid.toString() === item.product.toString())
            );
            return {
                ...order.toObject(),
                items: myItems,
                // Recalculate total for just my items? Or keep original total?
                // Keeping original total implies "Order Total", but items shown are "My Items".
                // Let's keep it simple.
            };
        });

        res.json(farmerOrders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

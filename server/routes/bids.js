const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Bid = require('../models/Bid');
const Order = require('../models/Order');

// @route   POST /bids/place
// @desc    Place a bid on a product (Feature 2 Strict)
// @access  Private (Buyer only)
router.post('/place', auth, async (req, res) => {
    try {
        const { productId, bidAmount, requestedQuantity } = req.body;
        const amount = Number(bidAmount);
        const quantity = Number(requestedQuantity);

        if (!productId || Number.isNaN(amount) || Number.isNaN(quantity)) {
            return res.status(400).json({ message: 'Product ID, offered price, and quantity are required' });
        }

        if (amount <= 0 || quantity <= 0) {
            return res.status(400).json({ message: 'Offered price and quantity must be greater than 0' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (product.farmer.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot place an offer on your own product' });
        }

        if (!product.isAuction || product.auctionStatus !== 'OPEN') {
            return res.status(400).json({ message: 'Auction is not OPEN' });
        }

        if (new Date() > new Date(product.auctionEndTime)) {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        if (quantity > product.quantity) {
            return res.status(400).json({
                message: `Requested quantity exceeds available quantity (${product.quantity})`
            });
        }

        const newBid = await Bid.create({
            productId,
            buyerId: req.user.id,
            bidAmount: amount,
            requestedQuantity: quantity
        });

        const update = {
            $push: {
                bids: {
                    user: req.user.id,
                    amount,
                    quantity,
                    time: Date.now()
                }
            }
        };

        const currentHighest = product.highestBid || 0;
        if (amount > currentHighest) {
            update.$set = {
                highestBid: amount,
                highestBidderId: req.user.id
            };
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, update, { new: true });

        res.json({
            message: 'Offer sent successfully',
            bid: newBid,
            product: updatedProduct
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /bids/:id/accept
// @desc    Accept a bid (Feature 3 Strict)
// @access  Private (Farmer only)
router.post('/:id/accept', auth, async (req, res) => {
    try {
        const bidId = req.params.id;
        const bid = await Bid.findById(bidId);

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const product = await Product.findById(bid.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product associated with bid not found' });
        }

        // Validate Owner
        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. Not your product.' });
        }

        if (product.auctionStatus !== 'OPEN') {
            return res.status(400).json({ message: 'Auction is not OPEN (it might be closed or sold)' });
        }

        if (bid.status && bid.status !== 'PENDING') {
            return res.status(400).json({ message: 'This offer has already been processed' });
        }

        const acceptedQuantity = bid.requestedQuantity || product.quantity;
        if (acceptedQuantity > product.quantity) {
            return res.status(400).json({
                message: `Insufficient quantity. Available quantity is ${product.quantity}`
            });
        }

        const totalAmount = bid.bidAmount * acceptedQuantity;

        // Create Order for accepted quantity at offered price per unit
        const newOrder = new Order({
            user: bid.buyerId,
            items: [{
                product: product._id,
                name: product.name,
                price: bid.bidAmount,
                quantity: acceptedQuantity
            }],
            totalAmount,
            paymentId: 'PENDING_AUCTION_' + Date.now(),
            status: 'pending'
        });

        await newOrder.save();

        // Update product inventory and auction state.
        product.quantity = Math.max(0, product.quantity - acceptedQuantity);

        if (product.quantity === 0) {
            product.auctionStatus = 'SOLD';
            product.highestBidderId = bid.buyerId;
            product.highestBid = bid.bidAmount;
        } else {
            const topPendingBid = await Bid.findOne({
                productId: product._id,
                status: 'PENDING'
            }).sort({ bidAmount: -1 });

            if (topPendingBid) {
                product.highestBid = topPendingBid.bidAmount;
                product.highestBidderId = topPendingBid.buyerId;
            } else {
                product.highestBid = 0;
                product.highestBidderId = undefined;
            }
            product.auctionStatus = 'OPEN';
        }

        bid.status = 'ACCEPTED';
        await bid.save();

        await product.save();

        res.json({ message: 'Bid accepted, order created', order: newOrder });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /bids/product/:productId
// @desc    Get all bids for a product
// @access  Private (Farmer only)
router.get('/product/:productId', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const bids = await Bid.find({ productId: req.params.productId })
            .populate('buyerId', 'name email') // Assuming User model has name/email
            .sort({ createdAt: -1 });

        res.json(bids);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

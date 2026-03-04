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
        const { productId, bidAmount } = req.body;

        if (!productId || !bidAmount) {
            return res.status(400).json({ message: 'Product ID and Bid Amount are required' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        if (!product.isAuction || product.auctionStatus !== 'OPEN') {
            return res.status(400).json({ message: 'Auction is not OPEN' });
        }

        if (new Date() > new Date(product.auctionEndTime)) {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        const currentHighest = product.highestBid || product.basePrice;
        const minIncrement = product.minBidIncrement || 0;
        const minRequired = currentHighest + minIncrement;

        // Special case: if no bids yet, first bid must start at basePrice (if minIncrement is 0 or basePrice is starting point)
        // Re-reading rule: bidAmount >= highestBid + minBidIncrement
        // If highestBid is 0 (no bids), then it should be >= basePrice + minIncrement? 
        // Or if no bids, simply >= basePrice.
        // Let's assume strict rule: bidAmount >= (highestBid || basePrice) + minBidIncrement
        // If highestBid is 0, we can use basePrice.

        // However, if it's the VERY FIRST BID, usually base price is accepted.
        // Let's stick to the prompt rule strictly: bidAmount >= highestBid + minBidIncrement
        // But we need to handle the "highestBid" correctly.

        let effectiveHighest = product.highestBid;
        if (!effectiveHighest || effectiveHighest === 0) {
            effectiveHighest = product.basePrice;
            // If first bid, maybe we don't force increment? Or do we?
            // "bidAmount >= highestBid + minBidIncrement"
            // If base is 100, inc is 10. First bid 110? Or 100?
            // Usually 100 is allowed.
            // Let's check logic: if product.bids.length === 0, then maybe just basePrice?
            // But strict Atomic Update below requires a condition.
        }

        if (bidAmount < effectiveHighest + minIncrement) {
            // Allow equality if it's the first bid and we treat basePrice as just a start? 
            // The prompt says "bidAmount >= highestBid + minBidIncrement"
            // If highestBid is actually 0, then we use basePrice.
            return res.status(400).json({
                message: `Bid must be at least ${effectiveHighest + minIncrement}`
            });
        }

        // Atomic Update: conditions
        // We want to ensure that BETWEEN our read and our write, no one else bumped the price higher than our bid.
        // Actually, we want to ensure we are STILL the highest. 
        // So we just need to ensure the product's highestBid is LESS than our bidAmount.
        // If someone else bit 150, and we bid 140 (thinking 130 was valid), we should fail.

        const updatedProduct = await Product.findOneAndUpdate(
            {
                _id: productId,
                auctionStatus: 'OPEN',
                $or: [
                    { highestBid: { $lt: bidAmount } },
                    { highestBid: { $exists: false } }, // In case field is missing? Should exist from schema default.
                    { highestBid: 0 }, // For initial state if 0
                    { highestBid: null }
                ]
            },
            {
                $set: {
                    highestBid: bidAmount,
                    highestBidderId: req.user.id
                },
                $push: {
                    bids: { // Keeping the embedded bids too for legacy support/easier fetch? 
                        // Prompt says "Store bid history in a new Bid collection". 
                        // It doesn't explicitly say REMOVE embedded. 
                        // But usually we shouldn't duplicate if "new collection" is the goal.
                        // However, my previous implementation uses embedded bids for display.
                        // To prevent breaking changes, I'll keep pushing to embedded for now OR update frontend to fetch from new collection.
                        // Feature 2 prompt: "Store bid history in a new Bid collection".
                        // I will do BOTH for safety, or just new collection if allowed.
                        // Given I don't want to break existing frontend immediately (or I am updating it?), I will do both.
                        // Atomic update on embedded array is safe.
                        user: req.user.id,
                        amount: bidAmount,
                        time: Date.now()
                    }
                }
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(409).json({ message: 'Bid rejected: Higher bid placed or auction closed.' });
        }

        // Create Bid Document history
        const newBid = new Bid({
            productId,
            buyerId: req.user.id,
            bidAmount
        });
        await newBid.save();

        res.json({ message: 'Bid placed successfully', product: updatedProduct });

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

        // Validate Status
        if (product.auctionStatus !== 'OPEN') {
            // Optional: You could allow accepting if expired but not sold? 
            // Strict rule says "Auction must be OPEN".
            // However, often farmers accept AFTER time expires. 
            // If "Auction must be OPEN" is strict rule, then fail.
            // But if "Disable accept if auction expired" is a UI rule, backend might need flexibility or same rule.
            // Feature 3 Request Rules: "Auction must be OPEN".
            return res.status(400).json({ message: 'Auction is not OPEN (it might be closed or sold)' });
        }

        // Update Product
        product.auctionStatus = 'SOLD';
        product.highestBidderId = bid.buyerId;
        product.highestBid = bid.bidAmount; // Ensure it matches accepted bid
        await product.save();

        // Create Order
        const newOrder = new Order({
            user: bid.buyerId, // Buyer
            items: [{
                product: product._id,
                name: product.name,
                price: bid.bidAmount,
                quantity: product.quantity
            }],
            totalAmount: bid.bidAmount,
            paymentId: 'PENDING_AUCTION_' + Date.now(),
            status: 'pending' // As per requirement: paymentStatus = "PENDING" (mapped to status usually)
            // If Order model has separate paymentStatus field, we should check.
            // Looking at Order model, it has 'status' default 'paid' (wait, default was paid?).
            // Feature 3 says: paymentStatus = "PENDING".
            // My previous Order model View showed: 
            // status: { type: String, default: 'paid' }
            // It didn't have distinct paymentStatus. I'll use `status`.
        });

        await newOrder.save();

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
            .sort({ bidAmount: -1 });

        res.json(bids);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

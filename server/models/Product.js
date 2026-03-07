const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true, // e.g., 'kg', 'dozen'
    },
    quantity: {
        type: Number,
        required: true
    },
    image: {
        type: String, // URL for now
        required: false
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isAuction: {
        type: Boolean,
        default: false
    },
    isAgriWaste: {
        type: Boolean,
        default: false
    },

    basePrice: {
        type: Number,
        default: 0
    },
    auctionEndTime: {
        type: Date
    },
    auctionStartTime: {
        type: Date
    },
    minBidIncrement: {
        type: Number,
        default: 0
    },
    highestBidderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    auctionStatus: {
        type: String,
        enum: ['OPEN', 'CLOSED', 'SOLD'],
        default: 'OPEN'
    },
    bids: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: {
            type: Number,
            required: true
        },
        time: {
            type: Date,
            default: Date.now
        }
    }],
    highestBid: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Product', ProductSchema);

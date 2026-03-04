const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['farmer', 'buyer'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    }
});

module.exports = mongoose.model('User', UserSchema);

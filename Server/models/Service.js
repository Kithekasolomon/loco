const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: String,
    category: String,               
    basePrice: {
        type: Number,
        min: 0,
    },
    image: String,                 
    isActive: {
        type: Boolean,
        default: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
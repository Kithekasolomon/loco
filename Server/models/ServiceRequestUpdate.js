// models/ServiceRequestUpdate.js
const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    images: [{
        type: String,  // array of image URLs
    }],
    statusAtUpdate: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'READY_FOR_COMPLETION', 'COMPLETED', 'CANCELLED'],
        default: 'IN_PROGRESS'
    },
    progressPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    isFinalUpdate: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequestUpdate', updateSchema);
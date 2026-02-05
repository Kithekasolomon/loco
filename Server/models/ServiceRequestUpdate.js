const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    message: { type: String, required: true },
    images: [{ type: String }],                   
    statusAtUpdate: { type: String, enum: ['IN_PROGRESS', 'READY_FOR_COMPLETION'] },

    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    isFinalUpdate: { type: Boolean, default: false },  

    statusAtUpdate: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_COMPLETION'],
        default: 'IN_PROGRESS'
    },


}, { timestamps: true });

module.exports = mongoose.model('ServiceRequestUpdate', updateSchema);
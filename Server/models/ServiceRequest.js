const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },

    serviceType: {
        type: String,
        required: true,
        trim: true,
    }, 

    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: String,                   
    price: Number, 
    
    status: {
        type: String,
        enum: [
            'PENDING',              
            'CONFIRMED',            
            'IN_PROGRESS',
            'READY_FOR_COMPLETION', 
            'COMPLETED',            
            'CANCELLED',
            'REJECTED',
            'PAYMENT_PENDING_APPROVAL',  
        ],
        default: 'PENDING',
        index: true,
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    completedByClient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },

    clientConfirmedPayment: {
        type: Boolean,
        default: false,
    },

    clientConfirmationNote: String,
    clientConfirmedAt: Date,

    adminFinalApproval: {
        type: Boolean,
        default: false,
    },
    approvedByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvedAt: Date,

    paymentProofImage: String,      
    paymentMethod: String,         
    transactionRef: String,

    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },

    image: String,                  

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    reviewComment: String,
    reviewedAt: Date,

    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancellationReason: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

},

    { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
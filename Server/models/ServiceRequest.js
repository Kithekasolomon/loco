const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        serviceType: {
            type: String,
            enum: ["REPAIR_MAINTENANCE", "PURCHASE"],
            required: true,
        },
        productType: String, // Dropdown in frontend
        productBrand: String, // Filtered dropdown in frontend based on productType
        specifics: String,
        problemType: String, // Required only for REPAIR_MAINTENANCE
        expectedTimeline: String,
        comment: String,
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }, // Technician
        price: Number,
        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        history: [
            {
                status: String,
                by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                comment: String,
                date: { type: Date, default: Date.now },
            },
        ], // For updates
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
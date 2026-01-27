// models/Contact.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["CUSTOMER", "VENDOR", "BOTH"],
            required: true,
            default: "CUSTOMER",
        },
        companyName: { type: String },
        displayName: { type: String, required: true },
        firstName: String,
        lastName: String,
        email: { type: String, lowercase: true },
        phone: String,
        mobile: String,
        website: String,

        billingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: "Kenya" },
        },

        shippingAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: "Kenya" },
        },

        currency: { type: String, default: "KES" },
        paymentTerms: { type: String, enum: ["Net 15", "Net 30", "Net 60", "Due on Receipt"], default: "Due on Receipt" },
        openingBalance: { type: Number, default: 0 },
        openingBalanceAsOf: { type: Date, default: Date.now },

        kraPin: String,
        vatNumber: String,
        isTaxExempt: { type: Boolean, default: false },
        notes: String,
        isActive: { type: Boolean, default: true },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

contactSchema.index({ displayName: 1 });
contactSchema.index({ type: 1 });
contactSchema.index({ email: 1 }, { sparse: true });
contactSchema.index({ kraPin: 1 }, { sparse: true });

module.exports = mongoose.model("Contact", contactSchema);
// models/Invoice.js
const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number }, // quantity * rate
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    }, // Income account
});

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, unique: true },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            required: true,
        },
        invoiceDate: { type: Date, default: Date.now },
        dueDate: Date,
        status: {
            type: String,
            enum: ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"],
            default: "DRAFT",
        },
        items: [invoiceItemSchema],
        subtotal: Number,
        tax: Number,
        total: Number,

        notes: String,
        terms: String,

        // Transaction link (created on posting)
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
        },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
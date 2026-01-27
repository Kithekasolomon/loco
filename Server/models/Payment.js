const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        paymentNumber: { type: String, unique: true },
        type: {
            type: String,
            enum: ["RECEIVED", "MADE"],
            required: true,
        },
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            required: true,
        },
        paymentDate: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ["CASH", "BANK_TRANSFER", "M_PESA", "CHEQUE", "CARD"],
            default: "BANK_TRANSFER",
        },
        reference: String,
        notes: String,

        appliedTo: [
            {
                invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
                bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
                amountApplied: { type: Number, required: true },
            },
        ],

        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: true,
        },

        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
        },

        status: {
            type: String,
            enum: ["DRAFT", "POSTED", "CANCELLED"],
            default: "DRAFT",
        },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ contact: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
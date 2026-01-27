const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    rate: { type: Number, required: true },
    amount: { type: Number },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    }, 
});

const billSchema = new mongoose.Schema(
    {
        billNumber: { type: String, unique: true },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
            required: true,
        },
        billDate: { type: Date, default: Date.now },
        dueDate: Date,
        status: {
            type: String,
            enum: ["DRAFT", "UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE"],
            default: "DRAFT",
        },
        items: [billItemSchema],
        subtotal: Number,
        tax: Number,
        total: Number,

        notes: String,

        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
        },

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

billSchema.index({ billNumber: 1 });
billSchema.index({ vendor: 1 });
billSchema.index({ status: 1 });

module.exports = mongoose.model("Bill", billSchema);
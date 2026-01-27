const mongoose = require("mongoose");

const transactionEntrySchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
    },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: String,
});

const transactionSchema = new mongoose.Schema(
    {
        transactionNumber: { type: String, unique: true }, 
        transactionDate: { type: Date, default: Date.now },
        reference: String,
        description: String,
        entries: [transactionEntrySchema], 

        sourceType: {
            type: String,
            enum: ["INVOICE", "BILL", "PAYMENT", "JOURNAL", "OPENING_BALANCE"],
            required: true,
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact",
        },

        posted: { type: Boolean, default: false }, 
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        postedAt: Date,

        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ sourceType: 1, sourceId: 1 });
transactionSchema.index({ "entries.account": 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    accountCode: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "ASSET",
        "LIABILITY",
        "EQUITY",
        "REVENUE",
        "EXPENSE",
      ],
      required: true,
    },
    subType: {
      type: String,
      enum: [
        "Cash",
        "Bank",
        "Accounts Receivable",
        "Other Current Asset",
        "Fixed Asset",
        "Accounts Payable",
        "Credit Card",
        "Other Current Liability",
        "Long Term Liability",
        "Equity",
        "Income",
        "Other Income",
        "Cost of Goods Sold",
        "Expense",
        "Other Expense",
      ],
    },
    description: String,
    isSubAccount: { type: Boolean, default: false },
    parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    balance: { type: Number, default: 0 }, // Current balance (for tracking)
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Compound index for performance
accountSchema.index({ accountCode: 1 });
accountSchema.index({ type: 1 });

module.exports = mongoose.model("Account", accountSchema);
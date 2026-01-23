const mongoose = require("mongoose");

const boqBreakdownItemSchema = new mongoose.Schema(
  {
    parentBoqItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoqItem",
      required: true,
    },
    system: {
      type: String,
      required: true,
      trim: true,
    },
    itemNumber: { type: String },
    description: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Auto-calculate total
boqBreakdownItemSchema.pre("save", function () {
  this.total = (this.quantity || 0) * (this.rate || 0);
});

module.exports = mongoose.model("BoqBreakdownItem", boqBreakdownItemSchema);

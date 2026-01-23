const mongoose = require("mongoose");

const boqItemSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: "General",
    },
    itemNumber: { type: String, required: true },
    description: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    valuedAmount: { type: Number },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

boqItemSchema.pre("save", async function () {
  this.total = (this.quantity || 0) * (this.rate || 0);
  this.valuedAmount = this.total * ((this.progressPercentage || 0) / 100);
});

// Optional: Also update on findOneAndUpdate (for edits)
boqItemSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (update.quantity || update.rate || update.progressPercentage) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const quantity = update.quantity ?? doc.quantity;
      const rate = update.rate ?? doc.rate;
      const progress = update.progressPercentage ?? doc.progressPercentage;

      update.total = quantity * rate;
      update.valuedAmount = update.total * (progress / 100);
      this.set(update);
    }
  }
});

module.exports = mongoose.model("BoqItem", boqItemSchema);
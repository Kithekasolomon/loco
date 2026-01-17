const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["CREATE_USER", "EDIT_USER", "DEACTIVATE_USER"],
      required: true,
    },
    payload: Object, 
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Approval", approvalSchema);

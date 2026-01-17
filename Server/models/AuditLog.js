const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: String, // CREATE_USER, EDIT_USER, LOGIN, APPROVE_ACTION
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: Object,
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

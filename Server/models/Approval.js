const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: [
        "CREATE_USER",
        "EDIT_USER",
        "DEACTIVATE_USER",
        "RESTORE_USER",
        "CREATE_PROJECT",
        "EDIT_PROJECT",
        "DELETE_PROJECT",
        "EDIT_BOQ_ITEM",
        "DELETE_BOQ_ITEM",
        "CREATE_ACCOUNT",
        "EDIT_ACCOUNT",
        "DELETE_ACCOUNT",
        "CREATE_CONTACT",
        "EDIT_CONTACT",
        "DELETE_CONTACT",
        "CREATE_INVOICE",
        "EDIT_INVOICE",
        "DELETE_INVOICE",
        "CREATE_BILL",
        "EDIT_BILL",
        "DELETE_BILL",
        "CREATE_PAYMENT",
        "SUBMIT_DAILY_REPORT",
        "REVIEW_DAILY_REPORT",
        "ASSIGN_TECHNICIAN",
        "MARK_READY_FOR_COMPLETION",  
        "CONFIRM_COMPLETION",
        
      ],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      index: true,
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Approval", approvalSchema);

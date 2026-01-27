const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["TASK_ASSIGNED", "STATUS_CHANGED", "MENTION", "DUE_REMINDER"],
    },

    message: String,
    relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

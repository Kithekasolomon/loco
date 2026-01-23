const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    projectLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timelineStart: { type: Date, required: true },
    timelineEnd: { type: Date, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "ON_HOLD"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);

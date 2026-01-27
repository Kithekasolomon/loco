// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    column: { type: mongoose.Schema.Types.ObjectId, ref: "Column", required: true },

    title: { type: String, required: true },
    description: String,

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      default: "TODO",
    },

    dueDate: Date,              // 📅 calendar
    startDate: Date,            // timeline
    endDate: Date,              // timeline

    order: Number,              // position inside column
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);

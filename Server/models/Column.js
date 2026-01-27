// models/Column.js
const mongoose = require("mongoose");

const columnSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    name: { type: String, required: true },   // e.g. To Do, In Progress
    order: { type: Number, required: true },  // column position
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Column", columnSchema);

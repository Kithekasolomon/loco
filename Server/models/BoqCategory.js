const mongoose = require("mongoose");

const boqCategorySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    order: {
      type: Number,
      default: 9999, 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy user is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate category names within the same project
boqCategorySchema.index({ project: 1, name: 1 }, { unique: true });

// Auto-increment order for new categories within the same project
// Auto-increment order for new categories within the same project
boqCategorySchema.pre("save", async function () {
  if (!this.isNew) return;

  if (!this.project) {
    throw new Error("Project ID is required");
  }

  try {
    const last = await this.constructor
      .findOne({ project: this.project })
      .sort({ order: -1 })
      .select("order")
      .lean();

    this.order = last && typeof last.order === "number" && !isNaN(last.order)
      ? last.order + 1
      : 0;
  } catch (err) {
    throw err;
  }
});

// Optional: Make sure order is always a number (defensive)


module.exports = mongoose.model("BoqCategory", boqCategorySchema);

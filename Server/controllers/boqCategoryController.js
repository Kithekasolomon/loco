const BoqCategory = require("../models/BoqCategory");
const Project = require("../models/Project");

// Create new category (tab)
exports.createCategory = async (req, res) => {
  console.log("=== createCategory called ===");
  console.log("req.user:", req.user); // ← Critical: check if this exists
  console.log("req.params.projectId:", req.params.projectId);
  console.log("req.body:", req.body);

  try {
    const { projectId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const trimmedName = name.trim();

    const project = await Project.findById(projectId);
    if (!project) {
      console.log("Project not found:", projectId);
      return res.status(404).json({ message: "Project not found" });
    }

    if (!req.user || !req.user.id) {
      console.log("No authenticated user");
      return res
        .status(401)
        .json({ message: "Unauthorized: No user authenticated" });
    }

    const category = await BoqCategory.create({
      project: projectId,
      name: trimmedName,
      createdBy: req.user.id,
    });

    console.log("Category created successfully:", category);
    res.status(201).json(category);
  } catch (err) {
    console.error("createCategory ERROR:", err); // ← This will show the real error
    console.error("Error name:", err.name);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);

    if (err.code === 11000) {
      return res.status(400).json({
        message: `Category "${req.body.name}" already exists for this project`,
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    res.status(500).json({ message: "Failed to create category" });
  }
};

// Get all categories for a project (used to render tabs)
exports.getCategories = async (req, res) => {
  try {
    const { projectId } = req.params;

    const categories = await BoqCategory.find({ project: projectId })
      .sort({ order: 1, name: 1 })
      .select("name order createdAt")
      .lean();

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// Optional: Update (rename, reorder)
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await BoqCategory.findOneAndUpdate(
      { _id: categoryId, project: req.params.projectId }, // extra safety
      updates,
      { new: true, runValidators: true },
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

// Optional: Delete (only if no items use it — or cascade)
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await BoqCategory.findOne({
      _id: categoryId,
      project: req.params.projectId,
    });

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Optional: check if items exist
    const itemCount = await require("../models/BoqItem").countDocuments({
      project: req.params.projectId,
      category: category.name,
    });

    if (itemCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category with existing items. Delete or move items first.",
      });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};
// Reorder categories (expects array of { _id, order })
exports.reorderCategories = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { orderedIds } = req.body; // e.g. ["id1", "id2", "id3"] — new order

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "Invalid orderedIds array" });
    }

    // Verify all belong to this project
    const categories = await BoqCategory.find({
      _id: { $in: orderedIds },
      project: projectId,
    });

    if (categories.length !== orderedIds.length) {
      return res.status(400).json({ message: "Some categories not found or do not belong to this project" });
    }

    // Prepare bulk operations
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await BoqCategory.bulkWrite(bulkOps);

    // Return updated list
    const updated = await BoqCategory.find({ project: projectId })
      .sort({ order: 1 })
      .select("name order _id");

    res.json(updated);
  } catch (err) {
    console.error("reorderCategories error:", err);
    res.status(500).json({ message: "Failed to reorder categories" });
  }
};

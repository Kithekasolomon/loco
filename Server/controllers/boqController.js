// controllers/boqController.js
const BoqCategory = require("../models/BoqCategory");
const BoqItem = require("../models/BoqItem");
const Project = require("../models/Project");
const ExcelJS = require('exceljs');

exports.exportBoqToExcel = async (req, res) => {
  try {
    const { projectId } = req.params;

    const items = await BoqItem.find({ project: projectId })
      .sort({ category: 1, itemNumber: 1 })
      .lean();

    if (!items.length) {
      return res.status(200).json({ message: "No items to export" });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Your App';
    workbook.created = new Date();

    const byCategory = items.reduce((acc, item) => {
      const cat = item.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, catItems]) => {
      const sheet = workbook.addWorksheet(category.substring(0, 31)); 

      sheet.addRow([
        'Item No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Total', 'Progress %', 'Valued Amount'
      ]).font = { bold: true };

      catItems.forEach(item => {
        sheet.addRow([
          item.itemNumber,
          item.description,
          item.unit,
          item.quantity,
          item.rate,
          item.total,
          item.progressPercentage,
          item.valuedAmount
        ]);
      });

      const catTotal = catItems.reduce((sum, i) => sum + (i.total || 0), 0);
      const catValued = catItems.reduce((sum, i) => sum + (i.valuedAmount || 0), 0);

      sheet.addRow([]);
      sheet.addRow(['', '', '', '', 'Category Total', catTotal, '', catValued])
        .font = { bold: true };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=BOQ_${projectId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate Excel' });
  }
};
// Get single BOQ item by ID
exports.getBoqItemById = async (req, res) => {
  try {
    const { itemId } = req.params

    const item = await BoqItem.findById(itemId)
      .populate("createdBy", "username firstName lastName")
      .lean()

    if (!item) {
      return res.status(404).json({ msg: "BOQ item not found" })
    }

    res.json(item)
  } catch (err) {
    console.error("getBoqItemById error:", err)
    res.status(500).json({ message: "Server error" })
  }
}

exports.createBoqItem = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      itemNumber,
      description,
      unit,
      quantity,
      rate,
      progressPercentage = 0,
      category = "General",
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

   
    let finalCategoryName = category.trim();

    if (finalCategoryName && finalCategoryName !== "General") {
      const existing = await BoqCategory.findOne({
        project: projectId,
        name: { $regex: new RegExp(`^${finalCategoryName}$`, "i") },
      });

      if (!existing) {
        await BoqCategory.create({
          project: projectId,
          name: finalCategoryName,
          createdBy: req.user.id,
        });
       
      }
    }
   

    const item = await BoqItem.create({
      project: projectId,
      category: finalCategoryName,
      itemNumber,
      description,
      unit,
      quantity,
      rate,
      progressPercentage,
      createdBy: req.user.id,
    });

   
    const freshCategories = await BoqCategory.find({ project: projectId })
      .sort({ order: 1, name: 1 })
      .select("name order");

    res.status(201).json({
      item,
      categories: freshCategories, 
    });
  } catch (err) {
    console.error("createBoqItem error:", err);
    res.status(500).json({ message: "Failed to create BOQ item" });
  }
};

exports.getCategoriesForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const categories = await BoqItem.distinct("category", {
      project: projectId,
    });
    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};



exports.updateBoqItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: "No data provided for update" });
    }

    const item = await BoqItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: "BOQ item not found" });
    }

    const quantity = updates.quantity !== undefined ? Number(updates.quantity) : item.quantity;
    const rate = updates.rate !== undefined ? Number(updates.rate) : item.rate;
    const progressPercentage = updates.progressPercentage !== undefined ? Number(updates.progressPercentage) : item.progressPercentage;

    const total = quantity * rate;
    const valuedAmount = total * (progressPercentage / 100);

    const updateData = {
      itemNumber: updates.itemNumber || item.itemNumber,
      description: updates.description || item.description,
      unit: updates.unit || item.unit,
      quantity,
      rate,
      progressPercentage,
      total,
      valuedAmount,
    };

    console.log("Updating with:", updateData); 
    const updatedItem = await BoqItem.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "username firstName lastName");

    res.json(updatedItem);
  } catch (err) {
    console.error("updateBoqItem error:", err);
    res.status(500).json({ 
      message: "Failed to update BOQ item",
      error: err.message 
    });
  }
};

exports.deleteBoqItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await BoqItem.findById(itemId);
    if (!item) return res.status(404).json({ msg: "BOQ item not found" });

    await BoqItem.deleteOne({ _id: itemId });

    res.json({ msg: "BOQ item deleted successfully" });
  } catch (err) {
    console.error("deleteBoqItem error:", err);
    res.status(500).json({ message: "Failed to delete BOQ item" });
  }
};

exports.getBoqItemsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const items = await BoqItem.find({ project: projectId })
      .populate("createdBy", "username firstName lastName")
      .sort({ itemNumber: 1 });

    const totals = items.reduce(
      (acc, item) => ({
        totalAmount: acc.totalAmount + (item.total || 0),
        valuedAmount: acc.valuedAmount + (item.valuedAmount || 0),
      }),
      { totalAmount: 0, valuedAmount: 0 },
    );

    res.json({
      items,
      summary: {
        totalContractSum: totals.totalAmount,
        valuedToDate: totals.valuedAmount,
        percentageComplete:
          totals.totalAmount > 0
            ? ((totals.valuedAmount / totals.totalAmount) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (err) {
    console.error("getBoqItems error:", err);
    res.status(500).json({ message: "Failed to fetch BOQ items" });
  }
};

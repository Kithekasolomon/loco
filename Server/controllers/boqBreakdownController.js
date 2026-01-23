const BoqBreakdownItem = require("../models/BoqBreakdownItem");
const BoqItem = require("../models/BoqItem");

exports.createBreakdownItem = async (req, res) => {
  try {
    const { boqItemId } = req.params;
    const { system, itemNumber, description, unit, quantity, rate } = req.body;

    const parent = await BoqItem.findById(boqItemId);
    if (!parent)
      return res.status(404).json({ msg: "Parent BOQ item not found" });

    const item = await BoqBreakdownItem.create({
      parentBoqItem: boqItemId,
      system,
      itemNumber: itemNumber || "",
      description,
      unit,
      quantity,
      rate,
      createdBy: req.user.id,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add breakdown item" });
  }
};

exports.getBreakdownByParent = async (req, res) => {
  try {
    const { boqItemId } = req.params;

    const items = await BoqBreakdownItem.find({ parentBoqItem: boqItemId })
      .sort({ system: 1, createdAt: 1 })
      .lean();

    const grouped = items.reduce((acc, item) => {
      const sys = item.system || "General";
      if (!acc[sys]) acc[sys] = [];
      acc[sys].push(item);
      return acc;
    }, {});

    const systems = Object.keys(grouped).map((name) => ({
      name,
      items: grouped[name],
      total: grouped[name].reduce((sum, i) => sum + (i.total || 0), 0),
    }));

    res.json(systems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch breakdown" });
  }
};
exports.updateBreakdownItem = async (req, res) => {
  try {
    const { boqItemId, itemId } = req.params;
    const updates = req.body;

    const item = await BoqBreakdownItem.findOneAndUpdate(
      { _id: itemId, parentBoqItem: boqItemId },
      updates,
      { new: true, runValidators: true },
    );

    if (!item) return res.status(404).json({ msg: "Item not found" });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to update item" });
  }
};

exports.deleteBreakdownItem = async (req, res) => {
  try {
    const { boqItemId, itemId } = req.params;

    const item = await BoqBreakdownItem.findOneAndDelete({
      _id: itemId,
      parentBoqItem: boqItemId,
    });

    if (!item) return res.status(404).json({ msg: "Item not found" });

    res.json({ msg: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item" });
  }
};
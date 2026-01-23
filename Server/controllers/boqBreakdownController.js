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

const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
  req.body = { actionType, payload };
  return requestApproval(req, res);
};

exports.createProjectRequest = async (req, res) => {
  try {
    const { name, location, projectLead, timelineStart, timelineEnd } =
      req.body;

    const payload = {
      name,
      location,
      projectLead,
      timelineStart,
      timelineEnd,
    };

    return forwardToApproval(req, res, "CREATE_PROJECT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request project creation" });
  }
};

exports.editProjectRequest = async (req, res) => {
  try {
    const payload = {
      projectId: req.params.id,
      updates: req.body,
    };
    return forwardToApproval(req, res, "EDIT_PROJECT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request edit" });
  }
};

exports.deleteProjectRequest = async (req, res) => {
  try {
    const payload = { projectId: req.params.id };
    return forwardToApproval(req, res, "DELETE_PROJECT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request deletion" });
  }
};

const Project = require("../models/Project");
const BoqItem = require("../models/BoqItem");

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("projectLead", "firstName lastName username")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("projectLead", "firstName lastName username")
      .populate("createdBy", "username");

    if (!project) return res.status(404).json({ msg: "Project not found" });

    // Fetch all BOQ items for this project
    const boqItems = await BoqItem.find({ project: req.params.id })
      .populate("createdBy", "username firstName lastName")
      .sort({ category: 1, itemNumber: 1 })
      .lean(); 

    // Group items by category
    const groupedByCategory = boqItems.reduce((acc, item) => {
      const catName = item.category || "General";
      if (!acc[catName]) {
        acc[catName] = [];
      }
      acc[catName].push(item);
      return acc;
    }, {});

    // Build categories array with summaries
    const categories = Object.keys(groupedByCategory).map(catName => {
      const items = groupedByCategory[catName];
      const catTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const catValued = items.reduce((sum, item) => sum + (item.valuedAmount || 0), 0);

      return {
        name: catName,
        items,
        summary: {
          total: catTotal,
          valued: catValued,
          percentage: catTotal > 0 ? ((catValued / catTotal) * 100).toFixed(2) : 0
        }
      };
    });

    // Grand totals
    const grandTotal = categories.reduce((sum, cat) => sum + cat.summary.total, 0);
    const grandValued = categories.reduce((sum, cat) => sum + cat.summary.valued, 0);

    res.json({
      project,
      boq: {
        categories, 
        summary: {
          totalContractSum: grandTotal,
          valuedToDate: grandValued,
          percentageComplete: grandTotal > 0 ? ((grandValued / grandTotal) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (err) {
    console.error("getProjectById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

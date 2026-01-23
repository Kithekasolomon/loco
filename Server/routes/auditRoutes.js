const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { Parser } = require("json2csv");

// GET /api/audit/logs - paginated + filtered
router.get("/logs", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      performedBy,
      targetUser,
      ipAddress,
      userAgent,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (action) query.action = { $regex: action, $options: "i" };
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    if (ipAddress) query.ipAddress = ipAddress;
    if (userAgent) query.userAgent = { $regex: userAgent, $options: "i" };

    // Role-based access control
    const currentUser = await User.findById(req.user.id).populate("role");
    if (!currentUser?.role) {
      return res
        .status(403)
        .json({ message: "Access denied - role not found" });
    }

    if (currentUser.role.name !== "SUPER_ADMIN") {
      // ADMIN can only see their own actions + actions on users they created
      const createdUsers = await User.find({ createdBy: req.user.id }).select(
        "_id",
      );
      const allowedTargets = createdUsers.map((u) => u._id.toString());

      query.$or = [
        { performedBy: req.user.id },
        { targetUser: { $in: allowedTargets } },
      ];
    }

    const logs = await AuditLog.find(query)
      .populate("performedBy", "username email firstName lastName")
      .populate("targetUser", "username email firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// GET /api/audit/export-csv
router.get("/export-csv", auth, role(["SUPER_ADMIN"]), async (req, res) => {
  try {
    const { action, performedBy, targetUser, ipAddress, startDate, endDate } =
      req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (action) query.action = { $regex: action, $options: "i" };
    if (performedBy) query.performedBy = performedBy;
    if (targetUser) query.targetUser = targetUser;
    if (ipAddress) query.ipAddress = ipAddress;

    const logs = await AuditLog.find(query)
      .populate("performedBy", "username email")
      .populate("targetUser", "username email")
      .sort({ createdAt: -1 })
      .lean();

    if (logs.length === 0) {
      return res
        .status(404)
        .json({ message: "No audit logs found for export" });
    }

    const fields = [
      { label: "Timestamp", value: "createdAt" },
      { label: "Action", value: "action" },
      { label: "Performed By", value: "performedBy.username" || "N/A" },
      { label: "Performed By Email", value: "performedBy.email" || "N/A" },
      {
        label: "Target User",
        value: (row) => row.targetUser?.username || "N/A",
      },
      { label: "Target Email", value: (row) => row.targetUser?.email || "N/A" },
      { label: "IP Address", value: "ipAddress" || "Unknown" },
      { label: "User Agent", value: "userAgent" },
      { label: "Status", value: "status" },
      { label: "Metadata", value: (row) => JSON.stringify(row.metadata || {}) },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(logs);

    res.header("Content-Type", "text/csv");
    res.attachment(`audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    console.error("Audit CSV export error:", error);
    res.status(500).json({ message: "Failed to export audit logs" });
  }
});

module.exports = router;

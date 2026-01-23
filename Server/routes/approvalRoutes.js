const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Approval = require("../models/Approval");  // Added for GET logic

const {
  requestApproval,
  reviewApproval,
  getMyApprovals,
} = require("../controllers/approvalController"); 

router.post(
  "/",
  auth,
  role(["ADMIN"]),
  requestApproval, 
);

router.get("/", auth, role(["SUPER_ADMIN"]), async (req, res) => {
  try {
    const approvals = await Approval.find()
      .populate("requestedBy", "username email firstName lastName")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 })
      .lean();

    // Group by actionType for clustering
    const grouped = approvals.reduce((acc, item) => {
      acc[item.actionType] = acc[item.actionType] || [];
      acc[item.actionType].push(item);
      return acc;
    }, {});

    res.json({
      total: approvals.length,
      pending: approvals.filter(a => a.status === "PENDING").length,
      groupedByType: grouped,
      items: approvals
    });
  } catch (err) {
    console.error("getApprovals error:", err);
    res.status(500).json({ message: "Failed to load approvals" });
  }
});

router.get("/my", auth, getMyApprovals);

router.put("/:id", auth, role(["SUPER_ADMIN"]), reviewApproval);

module.exports = router;
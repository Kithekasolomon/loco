const Approval = require("../models/Approval");
const executor = require("../services/approvalExecutor");
const AuditLog = require("../models/AuditLog");
const sendEmail = require("../utils/sendEmail");
const notification = require("../services/notification");

/**
 * REQUEST APPROVAL (ADMIN → SUPER_ADMIN)
 */
exports.requestApproval = async (req, res) => {
  const { actionType, payload } = req.body;

  const approval = await Approval.create({
    actionType,
    payload,
    requestedBy: req.user.id,
  });

  // 🔔 REAL-TIME: notify all SUPER_ADMINS
  notification.notifySuperAdmins("approval:new", {
    approvalId: approval._id,
    actionType,
    requestedBy: req.user.id,
    createdAt: approval.createdAt,
  });

  res.json({ msg: "Approval request submitted" });
};

/**
 * REVIEW APPROVAL (SUPER_ADMIN)
 */
exports.reviewApproval = async (req, res) => {
  const approval = await Approval.findById(req.params.id).populate(
    "requestedBy",
  );

  if (!approval || approval.status !== "PENDING") {
    return res.status(400).json({ msg: "Invalid approval" });
  }

  const { status } = req.body;

  if (status === "APPROVED") {
    await executor.execute(approval);
  }

  approval.status = status;
  approval.reviewedBy = req.user.id;
  approval.reviewedAt = new Date();
  await approval.save();

  // 📧 Email notification
  await sendEmail(
    approval.requestedBy.email,
    `Approval ${status}`,
    `<p>Your request (${approval.actionType}) was <b>${status}</b></p>`,
  );

  // 🔔 REAL-TIME: notify requesting user
  notification.notifyUser(approval.requestedBy._id, "approval:status", {
    approvalId: approval._id,
    status,
    actionType: approval.actionType,
    reviewedAt: approval.reviewedAt,
  });

  // 🧾 Audit log
  await AuditLog.create({
    action: approval.actionType,
    performedBy: req.user.id,
    targetUser: approval.payload?.userId,
    status,
  });

  res.json({ msg: `Request ${status}` });
};

/**
 * GET MY APPROVAL REQUESTS (ADMIN)
 */
exports.getMyApprovals = async (req, res) => {
  const approvals = await Approval.find({
    requestedBy: req.user.id,
  }).sort({ createdAt: -1 });

  res.json(approvals);
};

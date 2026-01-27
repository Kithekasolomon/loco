// controllers/approvalController.js
const Approval = require("../models/Approval");
const executor = require("../services/approvalExecutor");
const AuditLog = require("../models/AuditLog");
const sendEmail = require("../utils/sendEmail");
const notification = require("../services/notification");
const Role = require("../models/Role");
const User = require("../models/User");

exports.requestApproval = async (req, res) => {
  const { actionType, payload } = req.body;

  try {
    const approval = await Approval.create({
      actionType,
      payload,
      requestedBy: req.user.id,
      status: "PENDING",
    });

    // Populate for better notification
    const populated = await Approval.findById(approval._id).populate(
      "requestedBy",
      "username email",
    );

    const notifyPayload = {
      approvalId: approval._id,
      actionType: approval.actionType,
      requestedBy: {
        id: req.user.id,
        username:
          populated.requestedBy?.username || req.user.username || "Admin",
      },
      createdAt: approval.createdAt.toISOString(),
      payloadSummary: payload.userId
        ? `User: ${payload.userId}`
        : JSON.stringify(payload),
    };

    // Notify SUPER_ADMINs via socket
    notification.notifySuperAdmins("approval:new", notifyPayload);

    // Email to all super admins
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    if (superAdminRole) {
      const superAdmins = await User.find({ role: superAdminRole._id }).select(
        "email",
      );
      const emails = superAdmins.map((sa) => sa.email).filter(Boolean);
      if (emails.length > 0) {
        await sendEmail(
          emails.join(","),
          `New Approval Request: ${actionType.replace(/_/g, " ")}`,
          `<p>A new request needs your approval:</p>
           <ul>
             <li>Type: ${actionType}</li>
             <li>Requested by: ${populated.requestedBy?.username || "Admin"} (${populated.requestedBy?.email})</li>
             <li>Details: ${notifyPayload.payloadSummary}</li>
           </ul>
           <p>Review in the approvals page.</p>`,
        );
      }
    }

    res.status(201).json({
      message: "Approval request submitted",
      approvalId: approval._id,
    });
  } catch (err) {
    console.error("requestApproval error:", err);
    res.status(500).json({ message: "Failed to create approval request" });
  }
};

exports.reviewApproval = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id).populate(
      "requestedBy",
      "email username",
    );

    if (!approval || approval.status !== "PENDING") {
      return res
        .status(400)
        .json({ msg: "Invalid or already processed approval" });
    }

    const { status } = req.body;
    if (!["APPROVED", "DENIED"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    let executedResult;
    if (status === "APPROVED") {
      executedResult = await executor.execute(approval);
    }

    approval.status = status;
    approval.reviewedBy = req.user.id;
    approval.reviewedAt = new Date();
    await approval.save();

    // Email to requester
    await sendEmail(
      approval.requestedBy.email,
      `Your Approval Request - ${status}`,
      `<p>Your ${approval.actionType.replace(/_/g, " ")} request was <strong>${status}</strong>.</p>`,
    );

   

    // Real-time update to requester
    notification.notifyUser(approval.requestedBy._id, "approval:status", {
      approvalId: approval._id,
      actionType: approval.actionType,
      status,
      reviewedAt: approval.reviewedAt.toISOString(),
    });

    // Audit log
    await AuditLog.create({
      action: `${approval.actionType}_${status}`,
      performedBy: req.user.id,
      targetUser: approval.payload?.userId || executedResult?._id,
      status,
      metadata: {
        approvalId: approval._id,
      },
    });

    res.json({ msg: `Request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("reviewApproval error:", err);
    res.status(500).json({ msg: "Failed to process approval" });
  }
};

exports.getMyApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ requestedBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "username");
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch your approvals" });
  }
};

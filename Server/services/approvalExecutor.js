// services/approvalExecutor.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const AuditLog = require("../models/AuditLog");

// New models
const Project = require("../models/Project");
const BoqItem = require("../models/BoqItem");

module.exports.execute = async (approval) => {
  const { actionType, payload } = approval;

  switch (actionType) {
    // ==================== USER ACTIONS (Existing) ====================
    case "CREATE_USER": {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(tempPassword, 10);

      const newUser = await User.create({
        ...payload,
        password: hashed,
        isActive: true,
      });

      const loginLink = `${process.env.BASE_URL}/login`;
      await sendEmail(
        newUser.email,
        "Your Account Has Been Activated",
        `<p>Hello ${newUser.firstName},</p>
         <p>Your account has been successfully activated.</p>
         <p><strong>Username:</strong> ${newUser.username}</p>
         <p><strong>Temporary Password:</strong> ${tempPassword}</p>
         <p><a href="${loginLink}">Click here to login</a></p>
         <p>Please change your password immediately after logging in.</p>`,
      );

      await AuditLog.create({
        action: "USER_CREATED",
        performedBy: approval.reviewedBy || approval.requestedBy,
        targetUser: newUser._id,
        status: "SUCCESS",
      });

      return newUser;
    }

    case "EDIT_USER": {
      const updated = await User.findByIdAndUpdate(
        payload.userId,
        payload.updates,
        { new: true },
      );

      await AuditLog.create({
        action: "USER_EDITED",
        performedBy: approval.reviewedBy,
        targetUser: payload.userId,
        status: "SUCCESS",
      });

      return updated;
    }

    case "DEACTIVATE_USER": {
      const user = await User.findById(payload.userId).populate("role");
      if (user.role.name === "SUPER_ADMIN") {
        throw new Error("Cannot deactivate SUPER_ADMIN");
      }

      const deactivated = await User.findByIdAndUpdate(
        payload.userId,
        { isActive: false, deletedAt: new Date() },
        { new: true },
      );

      await AuditLog.create({
        action: "USER_DEACTIVATED",
        performedBy: approval.reviewedBy,
        targetUser: payload.userId,
        status: "SUCCESS",
      });

      return deactivated;
    }

    case "RESTORE_USER": {
      const restored = await User.findByIdAndUpdate(
        payload.userId,
        { isActive: true, deletedAt: null },
        { new: true },
      );

      await AuditLog.create({
        action: "USER_RESTORED",
        performedBy: approval.reviewedBy,
        targetUser: payload.userId,
        status: "SUCCESS",
      });

      return restored;
    }

    // ==================== PROJECT ACTIONS ====================
    case "CREATE_PROJECT": {
      const project = await Project.create({
        ...payload,
        createdBy: approval.requestedBy,
      });

      await AuditLog.create({
        action: "PROJECT_CREATED",
        performedBy: approval.reviewedBy || approval.requestedBy,
        metadata: { projectId: project._id, projectName: project.name },
        status: "SUCCESS",
      });

      return project;
    }

    case "EDIT_PROJECT": {
      const updated = await Project.findByIdAndUpdate(
        payload.projectId,
        payload.updates,
        { new: true },
      );

      await AuditLog.create({
        action: "PROJECT_EDITED",
        performedBy: approval.reviewedBy,
        metadata: { projectId: payload.projectId },
        status: "SUCCESS",
      });

      return updated;
    }

    case "DELETE_PROJECT": {
      const project = await Project.findById(payload.projectId);
      if (!project) throw new Error("Project not found");

      await BoqItem.deleteMany({ project: payload.projectId }); // Cascade delete BOQ
      await Project.deleteOne({ _id: payload.projectId });

      await AuditLog.create({
        action: "PROJECT_DELETED",
        performedBy: approval.reviewedBy,
        metadata: { projectId: payload.projectId, projectName: project.name },
        status: "SUCCESS",
      });

      return { deleted: true };
    }

    // ==================== BOQ ITEM ACTIONS (Optional Approval) ====================
    case "CREATE_BOQ_ITEM": {
      const item = await BoqItem.create({
        ...payload,
        createdBy: approval.requestedBy,
      });

      await AuditLog.create({
        action: "BOQ_ITEM_CREATED",
        performedBy: approval.reviewedBy || approval.requestedBy,
        metadata: { projectId: payload.project, boqItemId: item._id },
        status: "SUCCESS",
      });

      return item;
    }

    case "EDIT_BOQ_ITEM": {
      const updated = await BoqItem.findByIdAndUpdate(
        payload.itemId,
        payload.updates,
        { new: true },
      );

      await AuditLog.create({
        action: "BOQ_ITEM_EDITED",
        performedBy: approval.reviewedBy,
        metadata: { boqItemId: payload.itemId },
        status: "SUCCESS",
      });

      return updated;
    }

    case "DELETE_BOQ_ITEM": {
      const item = await BoqItem.findById(payload.itemId);
      if (!item) throw new Error("BOQ item not found");

      await BoqItem.deleteOne({ _id: payload.itemId });

      await AuditLog.create({
        action: "BOQ_ITEM_DELETED",
        performedBy: approval.reviewedBy,
        metadata: { boqItemId: payload.itemId },
        status: "SUCCESS",
      });

      return { deleted: true };
    }

    default:
      throw new Error(`Unknown approval action: ${actionType}`);
  }
};

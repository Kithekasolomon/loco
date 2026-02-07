// controllers/userController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const sendEmail = require("../utils/sendEmail");
const { requestApproval } = require("./approvalController"); 
const Approval = require("../models/Approval");
const notification = require("../services/notification");

const forwardToApproval = async (req, res, actionType, payload) => {
  req.body = { actionType, payload };
  return requestApproval(req, res);
};

exports.requestCreateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, username, role } = req.body;

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      username,
      organization: req.user.organization,
      role,
      createdBy: req.user.id,
    };

    return forwardToApproval(req, res, "CREATE_USER", payload);
  } catch (error) {
    console.error("requestCreateUser error:", error);
    res.status(500).json({
      message: "Failed to request user creation",
      error: error.message,
    });
  }
};
// controllers/userController.js
exports.getOrganizationUsers = async (req, res) => {
  try {
    const { role } = req.query; 

    const filter = {
      organization: req.user.organization,
      isActive: true
    };

    if (role) {
      const roleDoc = await Role.findOne({ name: role.toUpperCase() });
      if (roleDoc) {
        filter.role = roleDoc._id;
      } else {
        return res.json([]); 
      }
    }

    const users = await User.find(filter)
      .select("firstName lastName username email phone role _id")
      .populate("role", "name")                    
      .sort({ firstName: 1 })
      .lean();                                     

    res.json(users);
  } catch (err) {
    console.error("getOrganizationUsers error:", err);
    res.status(500).json({ message: "Failed to fetch organization users" });
  }
};


exports.requestEditUser = async (req, res) => {
  try {
    const payload = {
      userId: req.params.id,
      updates: req.body,
    };
    return forwardToApproval(req, res, "EDIT_USER", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to create edit request" });
  }
};

exports.requestDeactivateUser = async (req, res) => {
  try {
    const payload = { userId: req.params.id };
    return forwardToApproval(req, res, "DEACTIVATE_USER", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to create deactivation request" });
  }
};

exports.requestRestoreUser = async (req, res) => {
  try {
    const approval = await Approval.create({
      actionType: "RESTORE_USER",
      payload: { userId: req.params.id },
      requestedBy: req.user.id,
    });

    // EMIT TO SUPER_ADMINs
    notification.notifySuperAdmins("approval:new", {
      approvalId: approval._id,
      actionType: "RESTORE_USER",
      requestedBy: {
        id: req.user.id,
        username: req.user.username || "Admin"
      },
      createdAt: approval.createdAt,
      userId: req.params.id,
    });

    res.json({ msg: "Restore request sent for approval" });
  } catch (err) {
    console.error("requestRestoreUser error:", err);
    res.status(500).json({ msg: "Failed to send restore request" });
  }
};
// controllers/userController.js
exports.getOrganizationUsers = async (req, res) => {
  try {
    const { role } = req.query; 

    const filter = { organization: req.user.organization, isActive: true };
    if (role) {
      const roleDoc = await Role.findOne({ name: role.toUpperCase() });
      if (roleDoc) filter.role = roleDoc._id;
    }

    const users = await User.find(filter)
      .select("firstName lastName username email phone role")
      .populate("role", "name")
      .sort({ firstName: 1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
// controllers/userController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");         
const sendEmail = require("../utils/sendEmail");
const Approval = require("../models/Approval");

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, username, role } = req.body;

    const password = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      username,
      password: hashed,
      role,                     
      isActive: false,
      createdBy: req.user.id,
    });

    const activationLink = `${process.env.BASE_URL}/activate/${user._id}`;

    await sendEmail(
      email,
      "Account Created - Action Required",
      `<p>Hello ${firstName},</p>
       <p>Your account has been created.</p>
       <p><strong>Username:</strong> ${username}</p>
       <p><strong>Temporary Password:</strong> ${password}</p>
       <p>Please activate your account and change your password:</p>
       <a href="${activationLink}">Activate Account</a>
       <p>This link is valid for 48 hours.</p>`
    );

   
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

    if (!superAdminRole) {
      console.warn("SUPER_ADMIN role not found - skipping admin notifications");
    } else {
      const superAdmins = await User.find({ role: superAdminRole._id });

      if (superAdmins.length > 0) {
        const adminEmails = superAdmins.map(sa => sa.email);
        
        await sendEmail(
          adminEmails, 
          "New User Registration Request",
          `<p>Admin ${req.user.username} has created a new user:</p>
           <ul>
             <li>Name: ${firstName} ${lastName}</li>
             <li>Username: ${username}</li>
             <li>Email: ${email}</li>
           </ul>
           <p>Please review and approve activation if necessary.</p>`
        );
      }
    }

    return res.status(201).json({ 
      message: "User created successfully. Activation email sent. Awaiting approval where required." 
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ 
      message: "Failed to create user", 
      error: error.message 
    });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).send("Account activated successfully");
  } catch (error) {
    console.error("activateUser error:", error);
    return res.status(500).json({ message: "Activation failed" });
  }
};

exports.requestEditUser = async (req, res) => {
  try {
    await Approval.create({
      actionType: "EDIT_USER",
      payload: {
        userId: req.params.id,
        updates: req.body,
      },
      requestedBy: req.user.id,
    });

    return res.json({ message: "Edit request sent for approval" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create edit request" });
  }
};

exports.requestDeactivateUser = async (req, res) => {
  try {
    await Approval.create({
      actionType: "DEACTIVATE_USER",
      payload: {
        userId: req.params.id,
      },
      requestedBy: req.user.id,
    });

    return res.json({ message: "Deactivation request sent for approval" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create deactivation request" });
  }
};

exports.requestRestoreUser = async (req, res) => {
  try {
    await Approval.create({
      actionType: "RESTORE_USER",
      payload: { userId: req.params.id },
      requestedBy: req.user.id,
    });

    return res.json({ message: "Restore request sent for approval" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create restore request" });
  }
};
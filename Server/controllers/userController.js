const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const Approval = require("../models/Approval");


exports.createUser = async (req, res) => {
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

  const link = `${process.env.BASE_URL}/activate/${user._id}`;

  await sendEmail(
    email,
    "Account Created",
    `<p>Username: ${username}</p>
     <p>Password: ${password}</p>
     <a href="${link}">Activate Account</a>`
  );

  const superAdmins = await User.find({ role: "SUPER_ADMIN" });
  superAdmins.forEach((sa) =>
    sendEmail(
      sa.email,
      "New User Created",
      `Admin ${req.user.username} created user ${username}`
    )
  );

  res.json({ msg: "User created and email sent" });
};

exports.activateUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: true });
  res.send("Account activated successfully");
};
exports.requestEditUser = async (req, res) => {
  await Approval.create({
    actionType: "EDIT_USER",
    payload: {
      userId: req.params.id,
      updates: req.body,
    },
    requestedBy: req.user.id,
  });

  res.json({ msg: "Edit request sent for approval" });
};

exports.requestDeactivateUser = async (req, res) => {
  await Approval.create({
    actionType: "DEACTIVATE_USER",
    payload: {
      userId: req.params.id,
    },
    requestedBy: req.user.id,
  });

  res.json({ msg: "Deactivation request sent for approval" });
};
exports.requestRestoreUser = async (req, res) => {
  await Approval.create({
    actionType: "RESTORE_USER",
    payload: { userId: req.params.id },
    requestedBy: req.user.id,
  });

  res.json({ msg: "Restore request sent for approval" });
};


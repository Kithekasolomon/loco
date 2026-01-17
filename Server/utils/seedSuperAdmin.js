const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");

module.exports = async () => {
  // 1️⃣ Ensure SUPER_ADMIN role exists
  let superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

  if (!superAdminRole) {
    superAdminRole = await Role.create({
      name: "SUPER_ADMIN",
      permissions: ["*"], // wildcard (all permissions)
    });
  }

  // 2️⃣ Ensure Super Admin user exists
  const existingUser = await User.findOne({ username: "superadmin" });
  if (existingUser) return;

  const hashed = await bcrypt.hash("admin123", 10);

  await User.create({
    firstName: "Super",
    lastName: "Admin",
    username: "superadmin",
    email: process.env.EMAIL_USER,
    password: hashed,
    role: superAdminRole._id, // ✅ OBJECT ID
    isActive: true,
  });

  console.log("✅ Super Admin seeded");
};

// utils/seedSuperAdmin.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");

module.exports = async () => {
  try {
    let superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });

    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: "SUPER_ADMIN",
        permissions: ["*"],
      });
      console.log("✅ SUPER_ADMIN role created");
    }

    let superAdminUser = await User.findOne({ username: "superadmin" });

    const defaultPassword = "admin123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (!superAdminUser) {
      superAdminUser = await User.create({
        firstName: "Super",
        lastName: "Admin",
        username: "superadmin",
        email: process.env.EMAIL_USER || "kithekasolomon20@gmail.com",
        password: hashedPassword,
        role: superAdminRole._id,
        isActive: true,
      });
      console.log("✅ Super Admin user created");
      console.log(`   Username: superadmin`);
      console.log(`   Password: ${defaultPassword}`);
    } else {
      let needsUpdate = false;

      if (!superAdminUser.role || superAdminUser.role.toString() !== superAdminRole._id.toString()) {
        superAdminUser.role = superAdminRole._id;
        needsUpdate = true;
      }

      if (!superAdminUser.isActive) {
        superAdminUser.isActive = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await superAdminUser.save();
        console.log("✅ Existing Super Admin updated with correct role & activated");
      }
    }

    console.log("🌟 Super Admin seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
  }
};
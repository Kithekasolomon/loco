// utils/seedSuperAdmin.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const Organization = require("../models/Organization");

module.exports = async () => {
  try {
    // ───────────────────────────────────────────────
    // 1. Ensure essential roles exist
    // ───────────────────────────────────────────────
    const rolesToSeed = [
      { name: "SUPER_ADMIN", permissions: ["*"] },
      { name: "ADMIN", permissions: ["MANAGE_USERS", "VIEW_REQUESTS", "MANAGE_TECHNICIANS"] },
      { name: "TECHNICIAN", permissions: ["UPDATE_REQUESTS", "VIEW_ASSIGNED_REQUESTS"] },
      { name: "CLIENT", permissions: ["CREATE_REQUEST", "VIEW_OWN_REQUESTS"] },
    ];

    const roleMap = {};

    for (const r of rolesToSeed) {
      let role = await Role.findOne({ name: r.name });
      if (!role) {
        role = await Role.create(r);
        console.log(`✅ Role created: ${r.name}`);
      }
      roleMap[r.name] = role._id;
    }

    // ───────────────────────────────────────────────
    // 2. Create default Platform organization (for super admin)
    // ───────────────────────────────────────────────
    let platformOrg = await Organization.findOne({ name: "Platform" });

    if (!platformOrg) {
      platformOrg = await Organization.create({
        name: "Platform",
        currency: "USD",
        // You can add more defaults if needed
      });
      console.log("✅ Platform organization created");
    }

    // ───────────────────────────────────────────────
    // 3. Create / update SUPER_ADMIN user
    // ───────────────────────────────────────────────
    const superAdminUsername = "superadmin";
    let superAdmin = await User.findOne({ username: superAdminUsername });

    const defaultPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || "ChangeMe123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (!superAdmin) {
      superAdmin = await User.create({
        firstName: "System",
        lastName: "SuperAdmin",
        username: superAdminUsername,
        email: process.env.SUPERADMIN_EMAIL || "superadmin@yourdomain.com",
        phone: "+254700000000", // optional
        gender: "OTHER",
        password: hashedPassword,
        role: roleMap["SUPER_ADMIN"],
        organization: platformOrg._id,
        isActive: true,
      });

      console.log("✅ Super Admin user created");
      if (process.env.NODE_ENV !== "production") {
        console.log(`   Username: ${superAdminUsername}`);
        console.log(`   Password: ${defaultPassword}`);
        console.log(`   Email:    ${superAdmin.email}`);
      }
    } else {
      let needsUpdate = false;

      if (!superAdmin.organization) {
        superAdmin.organization = platformOrg._id;
        needsUpdate = true;
      }
      if (superAdmin.role?.toString() !== roleMap["SUPER_ADMIN"].toString()) {
        superAdmin.role = roleMap["SUPER_ADMIN"];
        needsUpdate = true;
      }
      if (!superAdmin.isActive) {
        superAdmin.isActive = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await superAdmin.save();
        console.log("✅ Existing Super Admin updated");
      }
    }

    console.log("🌟 Initial roles & super admin seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error(error.stack);
  }
};
const User = require("../models/User");
const bcrypt = require("bcryptjs");

module.exports = async () => {
  const exists = await User.findOne({ role: "SUPER_ADMIN" });
  if (!exists) {
    await User.create({
      firstName: "System",
      lastName: "Owner",
      username: "superadmin",
      email: "kithekasolomon20@gmail.com",
      password: await bcrypt.hash("SuperAdmin123", 10),
      role: "SUPER_ADMIN",
      isActive: true,
    });
    console.log("Super Admin seeded");
  }
};

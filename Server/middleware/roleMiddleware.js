// middleware/roleMiddleware.js
const User = require("../models/User");

module.exports = (roles) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("role");

    if (!user) {
      return res.status(403).json({ msg: "User not found - Access denied" });
    }

    // Safely check if role exists and has a name
    const userRoleName = user.role?.name;

    if (!userRoleName || !roles.includes(userRoleName)) {
      return res.status(403).json({ msg: "Access denied - Insufficient role" });
    }

    // Optional: attach role name to req for later use
    req.user.roleName = userRoleName;

    next();
  } catch (error) {
    console.error("Role middleware error:", error);
    return res.status(500).json({ msg: "Server error in role check" });
  }
};

const User = require("../models/User");

module.exports = (allowedRoles) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("role");

    if (!user) {
      return res.status(403).json({ msg: "User not found - Access denied" });
    }

    console.log("DEBUG ROLE CHECK ────────────────");
    console.log("User ID:       ", req.user.id);
    console.log("Raw role ID:   ", user.role); // should be ObjectId or null
    console.log("Populated role:", user.role ? user.role.toObject() : null);
    console.log("Role name:     ", user.role?.name);
    console.log("Allowed roles: ", allowedRoles);
    console.log(
      "Has access?    ",
      user.role?.name && allowedRoles.includes(user.role.name),
    );

    const userRoleName = user.role?.name;

    if (!userRoleName || !allowedRoles.includes(userRoleName)) {
      return res.status(403).json({
        msg: "Access denied - Insufficient role",
        yourRole: userRoleName || "NO_ROLE",
        required: allowedRoles,
      });
    }

    req.user.roleName = userRoleName;
    next();
  } catch (error) {
    console.error("Role middleware error:", error);
    return res.status(500).json({ msg: "Server error in role check" });
  }
};

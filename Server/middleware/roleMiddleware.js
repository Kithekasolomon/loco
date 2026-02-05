// middleware/roleMiddleware.js
const User = require("../models/User");

module.exports = (allowedRoles) => {
  // Optional: normalize allowedRoles to uppercase for case-insensitive comparison
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

  return async (req, res, next) => {
    try {
      // Fetch user with populated role (lean() is faster if you don't need full mongoose doc)
      const user = await User.findById(req.user.id)
        .populate("role", "name")   // only fetch name field — smaller payload
        .lean();                    // faster, plain JS object

      if (!user) {
        return res.status(403).json({
          message: "User not found - Access denied",
          code: "USER_NOT_FOUND"
        });
      }

      const roleName = user.role?.name;

      // Debug logging (keep in dev, remove/comment in production or use logger)
      if (process.env.NODE_ENV !== 'production') {
        console.log("───────────── ROLE CHECK ──────────────");
        console.log("User ID:      ", req.user.id);
        console.log("Role name:    ", roleName || "NO_ROLE");
        console.log("Allowed:      ", allowedRoles);
        console.log("Has access?   ", roleName && normalizedAllowed.includes(roleName.toUpperCase()));
      }

      if (!roleName) {
        return res.status(403).json({
          message: "Access denied - No role assigned",
          yourRole: "NO_ROLE",
          required: allowedRoles,
          code: "MISSING_ROLE"
        });
      }

      if (!normalizedAllowed.includes(roleName.toUpperCase())) {
        return res.status(403).json({
          message: "Access denied - Insufficient permissions",
          yourRole: roleName,
          required: allowedRoles,
          code: "INSUFFICIENT_ROLE"
        });
      }

      // Attach for convenience in controllers
      req.user.roleName = roleName;
      req.user.hasRole = (role) => roleName.toUpperCase() === role.toUpperCase();

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        message: "Server error during permission check",
        code: "ROLE_CHECK_ERROR"
      });
    }
  };
};
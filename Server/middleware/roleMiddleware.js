// middleware/roleMiddleware.js
const User = require("../models/User");

module.exports = (allowedRoles = []) => {
  // Normalize allowed roles to uppercase for consistent comparison
  const normalizedAllowed = allowedRoles.map(role => role.toUpperCase());

  return async (req, res, next) => {
    try {
      // Fetch user with only necessary fields
      const user = await User.findById(req.user.id)
        .populate("role", "name")
        .lean();

      if (!user) {
        return res.status(403).json({
          message: "User not found - Access denied",
          code: "USER_NOT_FOUND"
        });
      }

      const roleName = user.role?.name?.toUpperCase();

      if (!roleName) {
        return res.status(403).json({
          message: "Access denied - No role assigned",
          yourRole: "NO_ROLE",
          required: allowedRoles,
          code: "MISSING_ROLE"
        });
      }

      // ────────────────────────────────────────────────
      // SUPER_ADMIN has full access — bypass all checks
      // ────────────────────────────────────────────────
      if (roleName === "SUPER_ADMIN") {
        req.user.roleName = roleName;
        req.user.hasRole = () => true;           // Always true for super admin
        req.user.isSuperAdmin = true;            // Optional convenience flag
        return next();
      }

      // ────────────────────────────────────────────────
      // Normal role-based access control for other users
      // ────────────────────────────────────────────────
      if (!normalizedAllowed.includes(roleName)) {
        // Optional: log for debugging (remove or use logger in prod)
        if (process.env.NODE_ENV !== "production") {
          console.log(`[ROLE DENIED] User: ${req.user.id} | Role: ${roleName} | Required: ${allowedRoles.join(", ")}`);
        }

        return res.status(403).json({
          message: "Access denied - Insufficient permissions",
          yourRole: roleName,
          required: allowedRoles,
          code: "INSUFFICIENT_ROLE"
        });
      }

      // Attach helpers to req.user for use in controllers if needed
      req.user.roleName = roleName;
      req.user.hasRole = (role) => roleName === role.toUpperCase();
      req.user.isSuperAdmin = false;

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        message: "Server error during permission check",
        code: "ROLE_CHECK_ERROR",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  };
};
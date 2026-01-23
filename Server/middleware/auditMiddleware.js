const AuditLog = require("../models/AuditLog");
const { getIO } = require("../socket/socket");

module.exports = (action) => async (req, res, next) => {
  res.on("finish", async () => {
    if (!req.user) return;

    try {
      const auditEntry = {
        action,
        performedBy: req.user.id,
        targetUser: req.params.id || null,
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          req.connection.remoteAddress,
        userAgent: req.headers["user-agent"] || "Unknown",
        status: res.statusCode < 400 ? "SUCCESS" : "FAILED",
        metadata: {
          method: req.method,
          path: req.originalUrl,
          // Be careful what you log - avoid sensitive data
          body: req.body
            ? JSON.parse(
                JSON.stringify(req.body, (k, v) => {
                  if (["password", "token", "otp"].includes(k))
                    return "[REDACTED]";
                  return v;
                }),
              )
            : {},
          query: req.query,
        },
      };

      const log = await AuditLog.create(auditEntry);

      // Populate for real-time notification
      const populatedLog = await AuditLog.findById(log._id)
        .populate("performedBy", "username email firstName lastName")
        .populate("targetUser", "username email firstName lastName")
        .lean();

      // Real-time notification to SUPER_ADMINs
      const io = getIO();
      io.to("SUPER_ADMIN").emit("audit:new", {
        ...populatedLog,
        _id: log._id.toString(),
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt?.toISOString(),
      });
    } catch (error) {
      console.error("Audit log creation failed:", error);
      // Don't block response - just log error
    }
  });

  next();
};

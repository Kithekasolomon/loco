const AuditLog = require("../models/AuditLog");

module.exports = (action) => async (req, res, next) => {
  res.on("finish", async () => {
    if (!req.user) return;

    await AuditLog.create({
      action,
      performedBy: req.user.id,
      targetUser: req.params.id || null,
      status: res.statusCode < 400 ? "SUCCESS" : "FAILED",
      metadata: {
        method: req.method,
        path: req.originalUrl,
      },
    });
  });

  next();
};

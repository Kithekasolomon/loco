const User = require("../models/User");

module.exports = (roles) => async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("role");

  if (!user || !roles.includes(user.role.name)) {
    return res.status(403).json({ msg: "Access denied" });
  }

  next();
};

const User = require("../models/User");

module.exports = (roles) => async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!roles.includes(user.role)) {
    return res.status(403).json({ msg: "Access denied" });
  }
  next();
};

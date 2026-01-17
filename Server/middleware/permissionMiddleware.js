module.exports = (permission) => async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("role");

  if (user.role.name === "SUPER_ADMIN") return next();

  if (
    !user.role.permissions.includes(permission) &&
    !user.role.permissions.includes("*")
  ) {
    return res.status(403).json({ msg: "Permission denied" });
  }

  next();
};

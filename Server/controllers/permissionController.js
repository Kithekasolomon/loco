const Role = require("../models/Role");
const generatePermissions = require("../utils/generatePermissions");
const routePermissionMap = require("../utils/routePermissionMap");

exports.getPermissionMap = async (req, res) => {
  res.json(routePermissionMap());
};


exports.syncPermissions = async (req, res) => {
  const permissions = generatePermissions();

  await Role.updateMany(
    { name: { $ne: "SUPER_ADMIN" } },
    { $set: { permissions } }
  );

  res.json({ msg: "Permissions synced", permissions });
};

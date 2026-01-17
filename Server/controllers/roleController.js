const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  const { name, permissions } = req.body;

  const role = await Role.create({
    name,
    permissions,
    createdBy: req.user.id,
  });

  res.json(role);
};

exports.updateRolePermissions = async (req, res) => {
  const { permissions } = req.body;

  const role = await Role.findByIdAndUpdate(
    req.params.id,
    { permissions },
    { new: true }
  );

  res.json(role);
};

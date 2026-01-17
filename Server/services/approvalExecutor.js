const User = require("../models/User");
const bcrypt = require("bcryptjs");

module.exports.execute = async (approval) => {
  const { actionType, payload } = approval;

  switch (actionType) {
    case "CREATE_USER": {
      const hashed = await bcrypt.hash(payload.password, 10);
      return User.create({ ...payload, password: hashed });
    }

    case "EDIT_USER": {
      return User.findByIdAndUpdate(payload.userId, payload.updates);
    }

    case "DEACTIVATE_USER": {
  const user = await User.findById(payload.userId).populate("role");

  if (user.role.name === "SUPER_ADMIN") {
    throw new Error("SUPER_ADMIN cannot be deactivated");
  }

  return User.findByIdAndUpdate(payload.userId, {
    isActive: false,
    deletedAt: new Date(),
  });
}


    case "RESTORE_USER": {
      return User.findByIdAndUpdate(payload.userId, {
        isActive: true,
        deletedAt: null,
      });
    }

    default:
      throw new Error("Unknown approval action");
  }
};

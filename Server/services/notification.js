const { getIO } = require("../socket/socket");

exports.notifySuperAdmins = (event, payload) => {
  const io = getIO();
  io.to("SUPER_ADMIN").emit(event, payload);
};

exports.notifyUser = (userId, event, payload) => {
  const io = getIO();
  io.to(userId.toString()).emit(event, payload);
};

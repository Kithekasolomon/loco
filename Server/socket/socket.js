const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

module.exports.initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      const user = await User.findById(decoded.id).populate("role");
      socket.role = user.role.name;

      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    socket.join(socket.role); 
    socket.join(socket.userId); 

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.userId}`);
    });
  });
};

module.exports.getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

module.exports.initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: "http:// 192.168.3.37:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Optional: reduce polling fallback issues
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      const user = await User.findById(decoded.id).populate("role");
      if (!user || !user.role) {
        return next(new Error("User or role not found"));
      }

      socket.user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role.name,
      };

      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `🔌 User connected: ${socket.user.username || socket.userId} (${socket.user.role})`,
    );

    // Join rooms
    socket.join(socket.user.role); // e.g. "SUPER_ADMIN", "ADMIN"
    socket.join(socket.user.id); // personal room by userId string

    // Optional: client can request to join other rooms if needed
    socket.on("join", (data) => {
      if (data.room && socket.user.role === "SUPER_ADMIN") {
        socket.join(data.room);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Disconnected: ${socket.user.username || socket.userId}`);
    });
  });

  return io;
};

module.exports.getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

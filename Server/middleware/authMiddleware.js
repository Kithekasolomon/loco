// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose"); 

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let userQuery = User.findById(decoded.id)
      .populate("role", "name")
      .select("-password");

    if (mongoose.models.Organization) {
      userQuery = userQuery.populate("organization", "name currency");
    } else {
      console.warn("Organization model not yet registered during auth");
    }

    const user = await userQuery;

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: "Account is deactivated" });
    }

    if (!user.organization) {
      return res.status(403).json({
        msg: "User is not associated with any organization. Contact admin."
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Auth middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }
    res.status(401).json({ msg: "Authentication failed" });
  }
};
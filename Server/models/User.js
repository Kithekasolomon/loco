const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: String,
    password: String,
    // role: {
    //   type: String,
    //   enum: ["SUPER_ADMIN", "ADMIN", "USER"],
    //   default: "USER",
    // },
    role: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Role",
},
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);

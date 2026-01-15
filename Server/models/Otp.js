const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  otp: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Otp", otpSchema);

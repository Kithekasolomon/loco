const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || !user.isActive)
    return res.status(401).json({ msg: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ msg: "Invalid credentials" });

  const otp = generateOtp();
  await Otp.create({
    userId: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60000),
  });

  await sendEmail(user.email, "Your Login OTP", `<h3>Your OTP: ${otp}</h3>`);

  res.json({ msg: "OTP sent to email", userId: user._id });
};

exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  const record = await Otp.findOne({ userId, otp });
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  await Otp.deleteMany({ userId });

  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.json({ token });
};

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

  // IMPORTANT: Fetch the full user with populated role
  const user = await User.findById(userId).populate("role");

  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role, 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.json({ token });
};
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      company,
      phone,
      gender,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const username = email; // Use email as username for simplicity
    if (await User.findOne({ username })) {
      return res.status(400).json({ msg: "Username already exists" });
    }

    // Create new organization for the client's company
    const org = await Organization.create({ name: company });

    const clientRole = await Role.findOne({ name: "CLIENT" });
    if (!clientRole) {
      return res.status(500).json({ msg: "Client role not found. Contact admin." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      phone,
      gender,
      password: hashed,
      role: clientRole._id,
      organization: org._id,
      isActive: false,
    });

    const otp = generateOtp();
    await Otp.create({
      userId: user._id,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60000),
    });

    await sendEmail(email, "Signup Verification OTP", `<h3>Your OTP: ${otp}</h3>`);

    res.json({ msg: "OTP sent to email", userId: user._id });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ msg: "Failed to signup" });
  }
};

exports.verifySignupOtp = async (req, res) => {
  const { userId, otp } = req.body;

  const record = await Otp.findOne({ userId, otp });
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  const user = await User.findById(userId).populate("role");
  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  user.isActive = true;
  await user.save();
  await Otp.deleteMany({ userId });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
};

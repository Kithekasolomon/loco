const router = require("express").Router();
const { login, verifyOtp } = require("../controllers/authController");

router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;

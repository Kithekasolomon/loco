const router = require("express").Router();
const { login, verifyOtp } = require("../controllers/authController");
const { signup, verifySignupOtp } = require("../controllers/authController");

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signup);
router.post("/verify-signup-otp", verifySignupOtp);

module.exports = router;

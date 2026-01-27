const express = require("express");
const router = express.Router();
const { createPayment, getPayments } = require("../controllers/paymentController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);
const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

router.post("/", role(allowedRoles), createPayment);
router.get("/", role([...allowedRoles, "MANAGER"]), getPayments);

module.exports = router;
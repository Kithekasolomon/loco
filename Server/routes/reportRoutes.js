const express = require("express");
const router = express.Router();
const {
    getProfitAndLoss,
    getBalanceSheet,
    getARAging,
} = require("../controllers/reportController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT", "MANAGER"];

router.get("/profit-loss", role(allowedRoles), getProfitAndLoss);
router.get("/balance-sheet", role(allowedRoles), getBalanceSheet);
router.get("/ar-aging", role(allowedRoles), getARAging);

module.exports = router;
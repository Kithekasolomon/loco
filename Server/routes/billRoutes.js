// routes/billRoutes.js
const express = require("express");
const router = express.Router();
const {
    createBill,
    updateBill,
    deleteBill,
    getBills,
    getBillById,
} = require("../controllers/billController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Protect all routes
router.use(auth);

const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

router.post("/", role(allowedRoles), createBill);
router.put("/:id", role(allowedRoles), updateBill);
router.delete("/:id", role(["SUPER_ADMIN"]), deleteBill);

router.get("/", role([...allowedRoles, "MANAGER"]), getBills);
router.get("/:id", role([...allowedRoles, "MANAGER"]), getBillById);

module.exports = router;
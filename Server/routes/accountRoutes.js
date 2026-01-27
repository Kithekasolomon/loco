// routes/accountRoutes.js
const express = require("express");
const router = express.Router();

const {
    createAccount,
    updateAccount,
    deleteAccount,
    getAccounts,
    getAccountById,
} = require("../controllers/accountController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

router.post("/", role(["ADMIN", "SUPER_ADMIN"]), createAccount);
router.put("/:id", role(["ADMIN", "SUPER_ADMIN"]), updateAccount);
router.delete("/:id", role(["SUPER_ADMIN"]), deleteAccount);

router.get("/", role(["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"]), getAccounts);
router.get("/:id", role(["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"]), getAccountById);

module.exports = router;
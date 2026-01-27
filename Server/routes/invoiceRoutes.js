// routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoices,
    getInvoiceById,
} = require("../controllers/invoiceController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

const allowedRoles = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

router.post("/", role(allowedRoles), createInvoice);
router.put("/:id", role(allowedRoles), updateInvoice);
router.delete("/:id", role(["SUPER_ADMIN"]), deleteInvoice);
router.get("/", role([...allowedRoles, "MANAGER"]), getInvoices);
router.get("/:id", role([...allowedRoles, "MANAGER"]), getInvoiceById);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
    createContact,
    updateContact,
    deleteContact,
    getContacts,
    getContactById,
} = require("../controllers/contactController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

const adminRoles = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];

router.post("/", role(adminRoles), createContact);
router.put("/:id", role(adminRoles), updateContact);
router.delete("/:id", role(["SUPER_ADMIN"]), deleteContact);

router.get("/", role([...adminRoles, "MANAGER"]), getContacts);
router.get("/:id", role([...adminRoles, "MANAGER"]), getContactById);

module.exports = router;
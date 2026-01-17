const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/roleMiddleware");
const { createRole, updateRolePermissions } = require("../controllers/roleController");

router.post("/", auth, roleOnly(["SUPER_ADMIN"]), createRole);
router.put("/:id", auth, roleOnly(["SUPER_ADMIN"]), updateRolePermissions);

module.exports = router;

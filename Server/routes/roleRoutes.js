const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/roleMiddleware");
const { createRole, updateRolePermissions } = require("../controllers/roleController");
const Role = require("../models/Role");


router.get("/", auth, roleOnly(["SUPER_ADMIN"]), async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ msg: "Server error fetching roles" });
  }
});
router.post("/", auth, roleOnly(["SUPER_ADMIN"]), createRole);
router.put("/:id", auth, roleOnly(["SUPER_ADMIN"]), updateRolePermissions);

module.exports = router;

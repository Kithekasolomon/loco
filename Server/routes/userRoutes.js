const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  requestCreateUser,
  requestEditUser,
  requestDeactivateUser,
  requestRestoreUser,
  getOrganizationUsers,
} = require("../controllers/userController");
const User = require("../models/User");

router.post(
  "/request-create",
  auth,
  role(["SUPER_ADMIN", "ADMIN"]),
  audit("CREATE_USER_REQUEST"),
  requestCreateUser,
);

router.put(
  "/edit/:id",
  auth,
  role(["ADMIN"]),
  audit("EDIT_USER_REQUEST"),
  requestEditUser,
);


router.put(
  "/deactivate/:id",
  auth,
  role(["ADMIN"]),
  audit("DEACTIVATE_USER_REQUEST"),
  requestDeactivateUser,
);
router.put(
  "/restore/:id",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("RESTORE_USER_REQUEST"),
  requestRestoreUser,
);
router.get(
  "/organization",
  auth,
  role(["SITE_EMPLOYEE", "ADMIN", "SUPER_ADMIN"]),
  getOrganizationUsers
);

router.get("/", auth, role(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
  try {
    const users = await User.find().populate("role", "name").lean();

    const cleaned = users.map((user) => ({
      ...user,
      role: user.role || { name: "No role" },
    }));

    res.json(cleaned);
  } catch (err) {
    console.error("[GET /api/users] Error:", err.stack);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

module.exports = router;

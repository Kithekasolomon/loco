const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");


const {
  createUser,
  activateUser,
  requestEditUser,
  requestDeactivateUser,
  requestRestoreUser,
} = require("../controllers/userController");
const User = require("../models/User");

router.post("/create", auth, role(["SUPER_ADMIN", "ADMIN"]), createUser);
router.get("/activate/:id", activateUser);

router.put(
  "/edit/:id",
  auth,
  role(["ADMIN"]),
  requestEditUser
);

router.put(
  "/deactivate/:id",
  auth,
  role(["ADMIN"]),
  requestDeactivateUser
);
router.put(
  "/restore/:id",
  auth,
  role(["ADMIN"]),
  audit("RESTORE_USER_REQUEST"),
  requestRestoreUser
);
router.get("/", auth, role(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
  try {
    const users = await User.find()
      .populate("role", "name") 
      .lean(); 

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

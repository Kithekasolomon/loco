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

module.exports = router;

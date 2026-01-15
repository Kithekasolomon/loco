const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { createUser, activateUser } = require("../controllers/userController");

router.post("/create", auth, role(["SUPER_ADMIN", "ADMIN"]), createUser);
router.get("/activate/:id", activateUser);

module.exports = router;

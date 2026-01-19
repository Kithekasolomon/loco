// routes/permissionRoutes.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getPermissionMap } = require("../controllers/permissionController"); 

router.get("/map", auth, role(["SUPER_ADMIN"]), getPermissionMap);

module.exports = router;

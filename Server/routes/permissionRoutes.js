

const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const permissionController = require("../controllers/permissionController");

router.get(
  "/map",
  auth,
  role(["SUPER_ADMIN"]),
  permissionController.getPermissionMap
);

// routes/boqRoutes.js
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  createBoqItem,
  updateBoqItem,
  deleteBoqItem,
  getBoqItemsByProject,
  exportBoqToExcel,
  getCategoriesForProject,
  getBoqItemById,
} = require("../controllers/boqController");

// Direct actions (no approval needed — recommended for BOQ)
router.post(
  "/:projectId",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_ITEM_CREATE"),
  createBoqItem,
);

router.put(
  "/:itemId",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_ITEM_EDIT"),
  updateBoqItem,
);
router.get(
  "/project/:projectId/export",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  exportBoqToExcel,
);

router.delete(
  "/:itemId",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_ITEM_DELETE"),
  deleteBoqItem,
);
// Get single BOQ item
router.get("/:itemId", auth, role(["ADMIN", "SUPER_ADMIN"]), getBoqItemById);
// Anyone with access to project can view BOQ
router.get(
  "/project/:projectId/categories",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  getBoqItemsByProject,
);
router.get(
  "/project/:projectId",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  getCategoriesForProject,
);

module.exports = router;

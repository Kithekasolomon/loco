const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  reorderCategories,
} = require("../controllers/boqCategoryController");

const base = "/project/:projectId/categories";

router.post(
  base,
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_CATEGORY_CREATE"),
  createCategory,
);

router.get(base, auth, role(["ADMIN", "SUPER_ADMIN"]), getCategories);

router.put(
  `${base}/:categoryId`,
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_CATEGORY_UPDATE"),
  updateCategory,
);

router.delete(
  `${base}/:categoryId`,
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_CATEGORY_DELETE"),
  deleteCategory,
);
router.patch(
  "/project/:projectId/categories/reorder",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_CATEGORY_REORDER"),
  reorderCategories,
);

module.exports = router;

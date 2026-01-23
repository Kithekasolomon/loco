const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  createProjectRequest,
  editProjectRequest,
  deleteProjectRequest,
  getProjects,
  getProjectById,
} = require("../controllers/projectController");

router.post(
  "/request-create",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("PROJECT_CREATE_REQUEST"),
  createProjectRequest,
);

router.put(
  "/request-edit/:id",
  auth,
  role(["ADMIN"]),
  audit("PROJECT_EDIT_REQUEST"),
  editProjectRequest,
);

router.delete(
  "/request-delete/:id",
  auth,
  role(["ADMIN"]),
  audit("PROJECT_DELETE_REQUEST"),
  deleteProjectRequest,
);

router.get("/", auth, role(["ADMIN", "SUPER_ADMIN"]), getProjects);
router.get("/:id", auth, role(["ADMIN", "SUPER_ADMIN"]), getProjectById);

module.exports = router;

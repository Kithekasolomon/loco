const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  createBreakdownItem,
  getBreakdownByParent,
} = require("../controllers/boqBreakdownController");

router.post(
  "/:boqItemId/items",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("BOQ_BREAKDOWN_CREATE"),
  createBreakdownItem,
);

router.get(
  "/:boqItemId",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  getBreakdownByParent,
);

module.exports = router;

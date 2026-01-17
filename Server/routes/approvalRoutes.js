const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  requestApproval,
  reviewApproval,
  getMyApprovals,
} = require("../controllers/approvalController"); 

router.post(
  "/",
  auth,
  role(["ADMIN"]),
  requestApproval, 
);

router.get("/my", auth, getMyApprovals);

router.put("/:id", auth, role(["SUPER_ADMIN"]), reviewApproval);

module.exports = router;

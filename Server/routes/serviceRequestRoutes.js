const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
    createServiceRequest,
    getSingleRequest,
    getMyRequests,
    getTechnicianRequests,
    updateRequest,
} = require("../controllers/serviceRequestController");


router.get("/technician", auth, role(["TECHNICIAN"]), getTechnicianRequests); // Technician's assigned requests
router.put("/:id", auth, role(["TECHNICIAN"]), updateRequest); // Update (status/comment)
router.post(
    "/",
    auth,
    role(["CLIENT", "SUPER_ADMIN", "ADMIN"]),   // ← add these
    createServiceRequest
);

// Clients see their own requests + super-admins see everything via /admin/requests
router.get(
    "/my",
    auth,
    role(["CLIENT", "SUPER_ADMIN", "ADMIN"]),   // ← add these
    getMyRequests
);

// Get single request detail (accessible by client, assigned technician, or admin/superadmin)
router.get("/:id", auth, role(["CLIENT", "TECHNICIAN", "SUPER_ADMIN", "ADMIN"]), getSingleRequest);

module.exports = router;
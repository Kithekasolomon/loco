const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");
const { uploadMultiple, uploadSingle } = require('../middleware/upload');

const {
    createDraft,
    updateDraft,
    submitForApproval,
    reviewReport,
    getProjectReports,       
    getMyReports,
    uploadPhotos,            
    getWeeklyAggregate,
    

} = require("../controllers/dailySiteReportController");

const base = "/projects/:projectId/daily-reports";

router.post(`${base}`, auth, role(["SITE_EMPLOYEE", "SUPER_ADMIN"]), audit("DAILY_REPORT_CREATE"), createDraft);
router.put(`${base}/:reportId`, auth, role(["SITE_EMPLOYEE", "SUPER_ADMIN"]), updateDraft);
router.post(`${base}/:reportId/submit`, auth, role(["SITE_EMPLOYEE", "SUPER_ADMIN"]), submitForApproval);

router.put(
    `${base}/:reportId/review`,
    auth,
    role(["SUPER_ADMIN"]),
    audit("DAILY_REPORT_REVIEW"),
    reviewReport
);

router.get(base, auth, role(["ADMIN", "SUPER_ADMIN", "SITE_EMPLOYEE"]), getProjectReports);

router.post('/projects/:projectId/daily-reports', auth, role(['SITE_EMPLOYEE','SUPER_ADMIN']), createDraft);
router.put('/daily-reports/:reportId', auth, role(['SITE_EMPLOYEE','SUPER_ADMIN']), updateDraft);
router.post('/daily-reports/:reportId/submit', auth, role(['SITE_EMPLOYEE','SUPER_ADMIN']), submitForApproval);
router.put('/daily-reports/:reportId/review', auth, role(['SUPER_ADMIN']), reviewReport);
router.get(
    `${base}`,
    auth,
    role(["ADMIN", "SUPER_ADMIN", "SITE_EMPLOYEE"]),
    getProjectReports           
);
router.get('/projects/:projectId/weekly-report', auth, getWeeklyAggregate);

// File uploads
router.post(
    '/daily-reports/:reportId/upload',
    auth,
    role(['SITE_EMPLOYEE', "SUPER_ADMIN"]),
    uploadMultiple,
    uploadPhotos
);

module.exports = router;
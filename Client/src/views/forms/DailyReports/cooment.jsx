// i want to create a service where a client will signup in the system using name, Company, phone number, gender, email, set password and confirms password,, then when they signup it sends OTP to their email,, after the client is logged in ,, they will access the tECHNICIAN service where they will be able to request for technician service in a page which will include,, service type which is a dropdown of; 1. Repair and maintainance or Purchase, ,, whatever they select will determine what will other input fields in the modal form contain,,for example if they select repairs and maintanace, the input fields will include; product type give a dropdown of a list of devices that can be repaired by a technician, Product Brand type or model ,,filter to according the product type they selected give them a variety of models to choose from in a dropdown and the specifics, Problem type, expected timeline, comment, assigned to;give a list of technician in a dropdown where they will select the technician they want, price,,, after they save the request will be put in status pending, then send email to that client and the technician and the super admin concerning the request,they will also be able to upload photos of the product , then there will be a page where the specific technician will see his own requests from clients and will give specific updates which will also send emails to all the three,, we will first start with the backend intergration then frontend later,,, my user model;

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//     {
//         firstName: String,
//         lastName: String,
//         username: { type: String, unique: true },
//         email: { type: String, unique: true },
//         phone: String,
//         password: String,

//         role: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Role",
//         },

//         organization: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Organization",
//             required: true,
//         },
//         isActive: { type: Boolean, default: false },
//         createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     },
//     { timestamps: true }
// );


// module.exports = mongoose.model("User", userSchema);
// role model; const mongoose = require("mongoose");

// const roleSchema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             unique: true,
//             uppercase: true,
//             required: true,
//         },
//         permissions: [
//             {
//                 type: String,
//             },
//         ],
//         createdBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//         },
//     },
//     { timestamps: true }
// );

// module.exports = mongoose.model("Role", roleSchema);
// otp model; const mongoose = require("mongoose");

// const otpSchema = new mongoose.Schema({
//     userId: mongoose.Schema.Types.ObjectId,
//     otp: String,
//     expiresAt: Date,
// });

// module.exports = mongoose.model("Otp", otpSchema);
// organization model; const mongoose = require("mongoose");

// const organizationSchema = new mongoose.Schema(
//     {
//         name: { type: String, required: true },
//         currency: { type: String, default: "USD" },
//         fiscalYearStart: { type: Date },
//         createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     },
//     { timestamps: true }
// );

// module.exports = mongoose.model("Organization", organizationSchema);
// approval model; const mongoose = require("mongoose");

// const approvalSchema = new mongoose.Schema(
//     {
//         actionType: {
//             type: String,
//             enum: [
//                 "CREATE_USER",
//                 "EDIT_USER",
//                 "DEACTIVATE_USER",
//                 "RESTORE_USER",
//                 "CREATE_PROJECT",
//                 "EDIT_PROJECT",
//                 "DELETE_PROJECT",
//                 "EDIT_BOQ_ITEM",
//                 "DELETE_BOQ_ITEM",
//                 "CREATE_ACCOUNT",
//                 "EDIT_ACCOUNT",
//                 "DELETE_ACCOUNT",
//                 "CREATE_CONTACT",
//                 "EDIT_CONTACT",
//                 "DELETE_CONTACT",
//                 "CREATE_INVOICE",
//                 "EDIT_INVOICE",
//                 "DELETE_INVOICE",
//                 "CREATE_BILL",
//                 "EDIT_BILL",
//                 "DELETE_BILL",
//                 "CREATE_PAYMENT",
//                 "SUBMIT_DAILY_REPORT",
//                 "REVIEW_DAILY_REPORT",
//                 "ASSIGN_TECHNICIAN",
//                 "MARK_READY_FOR_COMPLETION",
//                 "CONFIRM_COMPLETION",

//             ],
//             required: true,
//         },
//         payload: {
//             type: mongoose.Schema.Types.Mixed,
//             required: true,
//         },
//         requestedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         status: {
//             type: String,
//             enum: ["PENDING", "APPROVED", "DENIED", "REJECTED"],
//             default: "PENDING",
//         },
//         reviewedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//         },
//         targetRequest: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "ServiceRequest",
//             index: true,
//         },
//         reviewedAt: Date,
//     },
//     { timestamps: true },
// );

// module.exports = mongoose.model("Approval", approvalSchema);
// role middleware;// middleware/roleMiddleware.js
// const User = require("../models/User");

// module.exports = (allowedRoles) => {
//     // Optional: normalize allowedRoles to uppercase for case-insensitive comparison
//     const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

//     return async (req, res, next) => {
//         try {

//             const user = await User.findById(req.user.id)
//                 .populate("role", "name")   // only fetch name field — smaller payload
//                 .lean();                    // faster, plain JS object

//             if (!user) {
//                 return res.status(403).json({
//                     message: "User not found - Access denied",
//                     code: "USER_NOT_FOUND"
//                 });
//             }

//             const roleName = user.role?.name;

//             // Debug logging (keep in dev, remove/comment in production or use logger)
//             if (process.env.NODE_ENV !== 'production') {
//                 console.log("───────────── ROLE CHECK ──────────────");
//                 console.log("User ID:      ", req.user.id);
//                 console.log("Role name:    ", roleName || "NO_ROLE");
//                 console.log("Allowed:      ", allowedRoles);
//                 console.log("Has access?   ", roleName && normalizedAllowed.includes(roleName.toUpperCase()));
//             }

//             if (!roleName) {
//                 return res.status(403).json({
//                     message: "Access denied - No role assigned",
//                     yourRole: "NO_ROLE",
//                     required: allowedRoles,
//                     code: "MISSING_ROLE"
//                 });
//             }

//             if (!normalizedAllowed.includes(roleName.toUpperCase())) {
//                 return res.status(403).json({
//                     message: "Access denied - Insufficient permissions",
//                     yourRole: roleName,
//                     required: allowedRoles,
//                     code: "INSUFFICIENT_ROLE"
//                 });
//             }

//             // Attach for convenience in controllers
//             req.user.roleName = roleName;
//             req.user.hasRole = (role) => roleName.toUpperCase() === role.toUpperCase();

//             next();
//         } catch (error) {
//             console.error("Role middleware error:", error);
//             return res.status(500).json({
//                 message: "Server error during permission check",
//                 code: "ROLE_CHECK_ERROR"
//             });
//         }
//     };
// }; permission middleware; module.exports = (permission) => async (req, res, next) => {
//     const user = await User.findById(req.user.id).populate("role");

//     if (user.role.name === "SUPER_ADMIN") return next();

//     if (
//         !user.role.permissions.includes(permission) &&
//         !user.role.permissions.includes("*")
//     ) {
//         return res.status(403).json({ msg: "Permission denied" });
//     }

//     next();
// };
// auth middleware;// middleware/authMiddleware.js

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const mongoose = require("mongoose");

// module.exports = async (req, res, next) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).json({ msg: "No token provided" });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         let userQuery = User.findById(decoded.id)
//             .populate("role", "name")
//             .select("-password");

//         if (mongoose.models.Organization) {
//             userQuery = userQuery.populate("organization", "name currency");
//         } else {
//             console.warn("Organization model not yet registered during auth");
//         }

//         const user = await userQuery;

//         if (!user) {
//             return res.status(401).json({ msg: "User not found" });
//         }

//         if (!user.isActive) {
//             return res.status(403).json({ msg: "Account is deactivated" });
//         }

//         if (!user.organization) {
//             return res.status(403).json({
//                 msg: "User is not associated with any organization. Contact admin."
//             });
//         }

//         req.user = user;
//         next();

//     } catch (err) {
//         console.error("Auth middleware error:", err.message);
//         if (err.name === "TokenExpiredError") {
//             return res.status(401).json({ msg: "Token expired" });
//         }
//         if (err.name === "JsonWebTokenError") {
//             return res.status(401).json({ msg: "Invalid token" });
//         }
//         res.status(401).json({ msg: "Authentication failed" });
//     }
// }; user controller;// controllers/userController.js
// const bcrypt = require("bcryptjs");
// const User = require("../models/User");
// const Role = require("../models/Role");
// const sendEmail = require("../utils/sendEmail");
// const { requestApproval } = require("./approvalController");
// const Approval = require("../models/Approval");
// const notification = require("../services/notification");

// const forwardToApproval = async (req, res, actionType, payload) => {
//     req.body = { actionType, payload };
//     return requestApproval(req, res);
// };

// exports.requestCreateUser = async (req, res) => {
//     try {
//         const { firstName, lastName, email, phone, username, role } = req.body;

//         const payload = {
//             firstName,
//             lastName,
//             email,
//             phone,
//             username,
//             organization: req.user.organization,
//             role,
//             createdBy: req.user.id,
//         };

//         return forwardToApproval(req, res, "CREATE_USER", payload);
//     } catch (error) {
//         console.error("requestCreateUser error:", error);
//         res.status(500).json({
//             message: "Failed to request user creation",
//             error: error.message,
//         });
//     }
// };
// // controllers/userController.js
// exports.getOrganizationUsers = async (req, res) => {
//     try {
//         const { role } = req.query;

//         const filter = {
//             organization: req.user.organization,
//             isActive: true
//         };

//         if (role) {
//             const roleDoc = await Role.findOne({ name: role.toUpperCase() });
//             if (roleDoc) {
//                 filter.role = roleDoc._id;
//             } else {
//                 return res.json([]);
//             }
//         }

//         const users = await User.find(filter)
//             .select("firstName lastName username email phone role _id")
//             .populate("role", "name")
//             .sort({ firstName: 1 })
//             .lean();

//         res.json(users);
//     } catch (err) {
//         console.error("getOrganizationUsers error:", err);
//         res.status(500).json({ message: "Failed to fetch organization users" });
//     }
// };


// exports.requestEditUser = async (req, res) => {
//     try {
//         const payload = {
//             userId: req.params.id,
//             updates: req.body,
//         };
//         return forwardToApproval(req, res, "EDIT_USER", payload);
//     } catch (err) {
//         res.status(500).json({ message: "Failed to create edit request" });
//     }
// };

// exports.requestDeactivateUser = async (req, res) => {
//     try {
//         const payload = { userId: req.params.id };
//         return forwardToApproval(req, res, "DEACTIVATE_USER", payload);
//     } catch (err) {
//         res.status(500).json({ message: "Failed to create deactivation request" });
//     }
// };

// exports.requestRestoreUser = async (req, res) => {
//     try {
//         const approval = await Approval.create({
//             actionType: "RESTORE_USER",
//             payload: { userId: req.params.id },
//             requestedBy: req.user.id,
//         });

//         // EMIT TO SUPER_ADMINs
//         notification.notifySuperAdmins("approval:new", {
//             approvalId: approval._id,
//             actionType: "RESTORE_USER",
//             requestedBy: {
//                 id: req.user.id,
//                 username: req.user.username || "Admin"
//             },
//             createdAt: approval.createdAt,
//             userId: req.params.id,
//         });

//         res.json({ msg: "Restore request sent for approval" });
//     } catch (err) {
//         console.error("requestRestoreUser error:", err);
//         res.status(500).json({ msg: "Failed to send restore request" });
//     }
// };
// // controllers/userController.js
// exports.getOrganizationUsers = async (req, res) => {
//     try {
//         const { role } = req.query;

//         const filter = { organization: req.user.organization, isActive: true };
//         if (role) {
//             const roleDoc = await Role.findOne({ name: role.toUpperCase() });
//             if (roleDoc) filter.role = roleDoc._id;
//         }

//         const users = await User.find(filter)
//             .select("firstName lastName username email phone role")
//             .populate("role", "name")
//             .sort({ firstName: 1 });

//         res.json(users);
//     } catch (err) {
//         res.status(500).json({ message: "Failed to fetch users" });
//     }
// }; auth controller; const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Otp = require("../models/Otp");
// const sendEmail = require("../utils/sendEmail");
// const generateOtp = require("../utils/generateOtp");

// exports.login = async (req, res) => {
//     const { username, password } = req.body;

//     const user = await User.findOne({ username });
//     if (!user || !user.isActive)
//         return res.status(401).json({ msg: "Invalid credentials" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(401).json({ msg: "Invalid credentials" });

//     const otp = generateOtp();
//     await Otp.create({
//         userId: user._id,
//         otp,
//         expiresAt: new Date(Date.now() + 5 * 60000),
//     });

//     await sendEmail(user.email, "Your Login OTP", `<h3>Your OTP: ${otp}</h3>`);

//     res.json({ msg: "OTP sent to email", userId: user._id });
// };

// exports.verifyOtp = async (req, res) => {
//     const { userId, otp } = req.body;

//     const record = await Otp.findOne({ userId, otp });
//     if (!record || record.expiresAt < Date.now()) {
//         return res.status(400).json({ msg: "Invalid or expired OTP" });
//     }

//     await Otp.deleteMany({ userId });

//     // IMPORTANT: Fetch the full user with populated role
//     const user = await User.findById(userId).populate("role");

//     if (!user) {
//         return res.status(404).json({ msg: "User not found" });
//     }

//     const token = jwt.sign(
//         {
//             id: user._id,
//             role: user.role,
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" },
//     );

//     res.json({ token });
// };
// approval controller;// controllers/approvalController.js
// const Approval = require("../models/Approval");
// const executor = require("../services/approvalExecutor");
// const AuditLog = require("../models/AuditLog");
// const sendEmail = require("../utils/sendEmail");
// const notification = require("../services/notification");
// const Role = require("../models/Role");
// const User = require("../models/User");

// exports.requestApproval = async (req, res) => {
//     const { actionType, payload } = req.body;

//     try {
//         const approval = await Approval.create({
//             actionType,
//             payload,
//             requestedBy: req.user.id,
//             status: "PENDING",
//         });

//         // Populate for better notification
//         const populated = await Approval.findById(approval._id).populate(
//             "requestedBy",
//             "username email",
//         );

//         const notifyPayload = {
//             approvalId: approval._id,
//             actionType: approval.actionType,
//             requestedBy: {
//                 id: req.user.id,
//                 username:
//                     populated.requestedBy?.username || req.user.username || "Admin",
//             },
//             createdAt: approval.createdAt.toISOString(),
//             payloadSummary: payload.userId
//                 ? `User: ${payload.userId}`
//                 : JSON.stringify(payload),
//         };

//         // Notify SUPER_ADMINs via socket
//         notification.notifySuperAdmins("approval:new", notifyPayload);

//         // Email to all super admins
//         const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
//         if (superAdminRole) {
//             const superAdmins = await User.find({ role: superAdminRole._id }).select(
//                 "email",
//             );
//             const emails = superAdmins.map((sa) => sa.email).filter(Boolean);
//             if (emails.length > 0) {
//                 await sendEmail(
//                     emails.join(","),
//                     `New Approval Request: ${actionType.replace(/_/g, " ")}`,
//                     `<p>A new request needs your approval:</p>
//            <ul>
//              <li>Type: ${actionType}</li>
//              <li>Requested by: ${populated.requestedBy?.username || "Admin"} (${populated.requestedBy?.email})</li>
//              <li>Details: ${notifyPayload.payloadSummary}</li>
//            </ul>
//            <p>Review in the approvals page.</p>`,
//                 );
//             }
//         }

//         res.status(201).json({
//             message: "Approval request submitted",
//             approvalId: approval._id,
//         });
//     } catch (err) {
//         console.error("requestApproval error:", err);
//         res.status(500).json({ message: "Failed to create approval request" });
//     }
// };

// exports.reviewApproval = async (req, res) => {
//     try {
//         const approval = await Approval.findById(req.params.id).populate(
//             "requestedBy",
//             "email username",
//         );

//         if (!approval || approval.status !== "PENDING") {
//             return res
//                 .status(400)
//                 .json({ msg: "Invalid or already processed approval" });
//         }

//         const { status } = req.body;
//         if (!["APPROVED", "DENIED"].includes(status)) {
//             return res.status(400).json({ msg: "Invalid status" });
//         }

//         let executedResult;
//         if (status === "APPROVED") {
//             executedResult = await executor.execute(approval);
//         }

//         approval.status = status;
//         approval.reviewedBy = req.user.id;
//         approval.reviewedAt = new Date();
//         await approval.save();

//         // Email to requester
//         await sendEmail(
//             approval.requestedBy.email,
//             `Your Approval Request - ${status}`,
//             `<p>Your ${approval.actionType.replace(/_/g, " ")} request was <strong>${status}</strong>.</p>`,
//         );



//         // Real-time update to requester
//         notification.notifyUser(approval.requestedBy._id, "approval:status", {
//             approvalId: approval._id,
//             actionType: approval.actionType,
//             status,
//             reviewedAt: approval.reviewedAt.toISOString(),
//         });

//         // Audit log
//         await AuditLog.create({
//             action: `${approval.actionType}_${status}`,
//             performedBy: req.user.id,
//             targetUser: approval.payload?.userId || executedResult?._id,
//             status,
//             metadata: {
//                 approvalId: approval._id,
//             },
//         });

//         res.json({ msg: `Request ${status.toLowerCase()}` });
//     } catch (err) {
//         console.error("reviewApproval error:", err);
//         res.status(500).json({ msg: "Failed to process approval" });
//     }
// };

// exports.getMyApprovals = async (req, res) => {
//     try {
//         const approvals = await Approval.find({ requestedBy: req.user.id })
//             .sort({ createdAt: -1 })
//             .populate("reviewedBy", "username");
//         res.json(approvals);
//     } catch (err) {
//         res.status(500).json({ msg: "Failed to fetch your approvals" });
//     }
// };
// user routes; const router = require("express").Router();
// const auth = require("../middleware/authMiddleware");
// const role = require("../middleware/roleMiddleware");
// const audit = require("../middleware/auditMiddleware");

// const {
//     requestCreateUser,
//     requestEditUser,
//     requestDeactivateUser,
//     requestRestoreUser,
//     getOrganizationUsers,
// } = require("../controllers/userController");
// const User = require("../models/User");

// router.post(
//     "/request-create",
//     auth,
//     role(["SUPER_ADMIN", "ADMIN"]),
//     audit("CREATE_USER_REQUEST"),
//     requestCreateUser,
// );

// router.put(
//     "/edit/:id",
//     auth,
//     role(["ADMIN"]),
//     audit("EDIT_USER_REQUEST"),
//     requestEditUser,
// );


// router.put(
//     "/deactivate/:id",
//     auth,
//     role(["ADMIN"]),
//     audit("DEACTIVATE_USER_REQUEST"),
//     requestDeactivateUser,
// );
// router.put(
//     "/restore/:id",
//     auth,
//     role(["ADMIN", "SUPER_ADMIN"]),
//     audit("RESTORE_USER_REQUEST"),
//     requestRestoreUser,
// );
// router.get(
//     "/organization",
//     auth,
//     role(["SITE_EMPLOYEE", "ADMIN", "SUPER_ADMIN"]),
//     getOrganizationUsers
// );

// router.get("/", auth, role(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
//     try {
//         const users = await User.find().populate("role", "name").lean();

//         const cleaned = users.map((user) => ({
//             ...user,
//             role: user.role || { name: "No role" },
//         }));

//         res.json(cleaned);
//     } catch (err) {
//         console.error("[GET /api/users] Error:", err.stack);
//         res.status(500).json({ message: "Server error while fetching users" });
//     }
// });

// module.exports = router;
// upload routes; const router = require('express').Router();
// const auth = require('../middleware/authMiddleware');
// const { uploadSingle } = require('../middleware/upload');
// router.post(
//     '/service-request-image',
//     auth,
//     (req, res, next) => {
//         uploadSingle(req, res, function (err) {
//             if (err) {
//                 // Multer-specific errors come here first
//                 console.error('Multer error during upload:');
//                 console.error('Error name:', err.name);
//                 console.error('Error message:', err.message);
//                 console.error('Full error:', JSON.stringify(err, null, 2));
//                 console.error('Stack:', err.stack);

//                 if (err.code === 'LIMIT_FILE_SIZE') {
//                     return res.status(400).json({ message: 'File too large (max 10MB)' });
//                 }
//                 if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//                     return res.status(400).json({ message: 'Unexpected field name – must be "file"' });
//                 }

//                 return res.status(400).json({
//                     message: err.message || 'File upload rejected by multer',
//                     code: err.code,
//                 });
//             }
//             next();
//         });
//     },
//     async (req, res) => {
//         try {
//             console.log('File successfully processed by multer:', {
//                 originalname: req.file?.originalname,
//                 mimetype: req.file?.mimetype,
//                 size: req.file?.size,
//                 path: req.file?.path,
//                 filename: req.file?.filename,
//             });

//             if (!req.file) {
//                 return res.status(400).json({ message: 'No file received' });
//             }

//             if (!req.file.path) {
//                 console.error('Cloudinary did not return a path!');
//                 return res.status(500).json({ message: 'Upload succeeded but no URL returned from Cloudinary' });
//             }

//             res.status(200).json({
//                 success: true,
//                 url: req.file.path,
//                 public_id: req.file.filename,
//             });
//         } catch (err) {
//             console.error('Post-multer upload error:');
//             console.error('Name:', err.name);
//             console.error('Message:', err.message);
//             console.error('Stack:', err.stack || 'No stack');
//             const safeErr = {
//                 name: err.name,
//                 message: err.message,
//                 code: err.code,
//                 http_code: err.http_code,
//             };
//             res.status(500).json({
//                 message: 'Server error during image processing',
//                 error: safeErr,
//             });
//         }
//     }
// );

// module.exports = router;  upload middleware; const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: (req, file) => {
//         const orgId = req.user?.organization?._id?.toString() || 'default';
//         return {
//             folder: `construction-reports/${orgId}`,
//             allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
//             public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '-')}`,
//         };
//     },
// });



// const upload = multer({
//     storage,
//     limits: { fileSize: 10 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.match(/image|pdf/)) {
//             cb(null, true);
//         } else {
//             cb(new Error('Only images and PDFs allowed'), false);
//         }
//     },
// });

// module.exports = {
//     uploadSingle: upload.single('file'),
//     uploadMultiple: upload.array('files', 10),
// };
// auth routes; const router = require("express").Router();
// const { login, verifyOtp } = require("../controllers/authController");

// router.post("/login", login);
// router.post("/verify-otp", verifyOtp);

// module.exports = router;
// approval routes; const router = require("express").Router();
// const auth = require("../middleware/authMiddleware");
// const role = require("../middleware/roleMiddleware");
// const Approval = require("../models/Approval");  // Added for GET logic

// const {
//     requestApproval,
//     reviewApproval,
//     getMyApprovals,
// } = require("../controllers/approvalController");

// router.post(
//     "/",
//     auth,
//     role(["ADMIN"]),
//     requestApproval,
// );

// router.get("/", auth, role(["SUPER_ADMIN"]), async (req, res) => {
//     try {
//         const approvals = await Approval.find()
//             .populate("requestedBy", "username email firstName lastName")
//             .populate("reviewedBy", "username email")
//             .sort({ createdAt: -1 })
//             .lean();

//         // Group by actionType for clustering
//         const grouped = approvals.reduce((acc, item) => {
//             acc[item.actionType] = acc[item.actionType] || [];
//             acc[item.actionType].push(item);
//             return acc;
//         }, {});

//         res.json({
//             total: approvals.length,
//             pending: approvals.filter(a => a.status === "PENDING").length,
//             groupedByType: grouped,
//             items: approvals
//         });
//     } catch (err) {
//         console.error("getApprovals error:", err);
//         res.status(500).json({ message: "Failed to load approvals" });
//     }
// });

// router.get("/my", auth, getMyApprovals);

// router.put("/:id", auth, role(["SUPER_ADMIN"]), reviewApproval);

// module.exports = router;
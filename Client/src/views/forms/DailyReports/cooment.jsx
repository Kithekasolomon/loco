// i want to have a page where the user will be able to signup an create a new account where they will fill in the sign up form using the following details;First name, Last name, Email, Phone number, Password, Confirm password,Company name,
//after the user has filled the form they will be able to login using their email and password
//after the user has logged in they will be able to go to the services page where they will be able to see the services that are available
//they will click the create new service request button to create a new service request
//the create new service request form will have the following details;Service type, Service description, Service location, Service date, Service time, Service price, Service status, Service image, assigned to
//after the user has filled the form they will be able to submit the service request
//after the user has submitted the service request they will be able to see the service request in the service request list
//the service request list will have the following details;Service type, Service description, Service location, Service date, Service time, Service price, Service status, Service image,assigned to
//the service request list will have a button to view the service request
//the service request list will have a button to edit the service request
//the service request list will have a button to cancel the service request
//the user can only cancel the service request if the service request is not completed
 //the user can update the status of the service they requested,,, after a ne service has been created ,,,the system automatically puts status pending but once the service is done ,,the user can confirm its done and the status changes to completed and if they cancel it the status changes to cancelled
//they can even share the service request to other users and leave reviews ,rating and comment /// i will provid e my backend files first
//give the user or client an option where they can upload a photo of their product or service they want to request

my user model;const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: String,
    password: String,
    
    role: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Role",
    },
    
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


module.exports = mongoose.model("User", userSchema);
approval model;const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: [
        "CREATE_USER",
        "EDIT_USER",
        "DEACTIVATE_USER",
        "RESTORE_USER",
        "CREATE_PROJECT",
        "EDIT_PROJECT",
        "DELETE_PROJECT",
        "EDIT_BOQ_ITEM",
        "DELETE_BOQ_ITEM",
        "CREATE_ACCOUNT",
        "EDIT_ACCOUNT",
        "DELETE_ACCOUNT",
        "CREATE_CONTACT",
        "EDIT_CONTACT",
        "DELETE_CONTACT",
        "CREATE_INVOICE",
        "EDIT_INVOICE",
        "DELETE_INVOICE",
        "CREATE_BILL",
        "EDIT_BILL",
        "DELETE_BILL",
        "CREATE_PAYMENT",
        "SUBMIT_DAILY_REPORT",
        "REVIEW_DAILY_REPORT",
        
      ],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Approval", approvalSchema);
otp mongoose.model;const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  otp: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Otp", otpSchema);
role model;const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      uppercase: true,
      required: true,
    },
    permissions: [
      {
        type: String, 
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);
user routes;const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const audit = require("../middleware/auditMiddleware");

const {
  requestCreateUser,
  requestEditUser,
  requestDeactivateUser,
  requestRestoreUser,
  getOrganizationUsers,
} = require("../controllers/userController");
const User = require("../models/User");

router.post(
  "/request-create",
  auth,
  role(["SUPER_ADMIN", "ADMIN"]),
  audit("CREATE_USER_REQUEST"),
  requestCreateUser,
);

router.put(
  "/edit/:id",
  auth,
  role(["ADMIN"]),
  audit("EDIT_USER_REQUEST"),
  requestEditUser,
);


router.put(
  "/deactivate/:id",
  auth,
  role(["ADMIN"]),
  audit("DEACTIVATE_USER_REQUEST"),
  requestDeactivateUser,
);
router.put(
  "/restore/:id",
  auth,
  role(["ADMIN", "SUPER_ADMIN"]),
  audit("RESTORE_USER_REQUEST"),
  requestRestoreUser,
);
router.get(
  "/organization",
  auth,
  role(["SITE_EMPLOYEE", "ADMIN", "SUPER_ADMIN"]),
  getOrganizationUsers
);

router.get("/", auth, role(["ADMIN", "SUPER_ADMIN"]), async (req, res) => {
  try {
    const users = await User.find().populate("role", "name").lean();

    const cleaned = users.map((user) => ({
      ...user,
      role: user.role || { name: "No role" },
    }));

    res.json(cleaned);
  } catch (err) {
    console.error("[GET /api/users] Error:", err.stack);
    res.status(500).json({ message: "Server error while fetching users" });
  }
});

module.exports = router;
approval routes;const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Approval = require("../models/Approval");  // Added for GET logic

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

router.get("/", auth, role(["SUPER_ADMIN"]), async (req, res) => {
  try {
    const approvals = await Approval.find()
      .populate("requestedBy", "username email firstName lastName")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 })
      .lean();

    // Group by actionType for clustering
    const grouped = approvals.reduce((acc, item) => {
      acc[item.actionType] = acc[item.actionType] || [];
      acc[item.actionType].push(item);
      return acc;
    }, {});

    res.json({
      total: approvals.length,
      pending: approvals.filter(a => a.status === "PENDING").length,
      groupedByType: grouped,
      items: approvals
    });
  } catch (err) {
    console.error("getApprovals error:", err);
    res.status(500).json({ message: "Failed to load approvals" });
  }
});

router.get("/my", auth, getMyApprovals);

router.put("/:id", auth, role(["SUPER_ADMIN"]), reviewApproval);

module.exports = router; 
auth routes;const router = require("express").Router();
const { login, verifyOtp } = require("../controllers/authController");

router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;
role routes;const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/roleMiddleware");
const { createRole, updateRolePermissions } = require("../controllers/roleController");
const Role = require("../models/Role");


router.get("/", auth, roleOnly(["SUPER_ADMIN"]), async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ msg: "Server error fetching roles" });
  }
});
router.post("/", auth, roleOnly(["SUPER_ADMIN"]), createRole);
router.put("/:id", auth, roleOnly(["SUPER_ADMIN"]), updateRolePermissions);

module.exports = router;
permission utils File; module.exports = {
  // ===== USERS =====
  USER_CREATE: "USER_CREATE",
  USER_EDIT: "USER_EDIT",
  USER_DEACTIVATE: "USER_DEACTIVATE",
  USER_VIEW: "USER_VIEW",

  // ===== ROLES & PERMISSIONS =====
  ROLE_MANAGE: "ROLE_MANAGE",
  PERMISSION_ASSIGN: "PERMISSION_ASSIGN",

  // ===== PROJECTS =====
  PROJECT_CREATE: "PROJECT_CREATE",
  PROJECT_EDIT: "PROJECT_EDIT",
  PROJECT_DELETE: "PROJECT_DELETE",
  PROJECT_VIEW: "PROJECT_VIEW",

  // ===== BOQ =====
  BOQ_CREATE: "BOQ_CREATE",
  BOQ_EDIT: "BOQ_EDIT",
  BOQ_DELETE: "BOQ_DELETE",

  // ===== APPROVALS =====
  APPROVAL_REVIEW: "APPROVAL_REVIEW",

  // ===== ACCOUNTING (future) =====
  ACCOUNT_CREATE: "ACCOUNT_CREATE",
  JOURNAL_POST: "JOURNAL_POST",
  INVOICE_CREATE: "INVOICE_CREATE",
  INVOICE_APPROVE: "INVOICE_APPROVE",

  // ===== DAILY REPORTS =====
  DAILY_REPORT_SUBMIT: "DAILY_REPORT_SUBMIT",
  DAILY_REPORT_APPROVE: "DAILY_REPORT_APPROVE",
  DAILY_REPORT_VIEW: "DAILY_REPORT_VIEW",



};
role Middleware;const User = require("../models/User");

module.exports = (allowedRoles) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("role");

    if (!user) {
      return res.status(403).json({ msg: "User not found - Access denied" });
    }

    console.log("DEBUG ROLE CHECK ────────────────");
    console.log("User ID:       ", req.user.id);
    console.log("Raw role ID:   ", user.role); // should be ObjectId or null
    console.log("Populated role:", user.role ? user.role.toObject() : null);
    console.log("Role name:     ", user.role?.name);
    console.log("Allowed roles: ", allowedRoles);
    console.log(
      "Has access?    ",
      user.role?.name && allowedRoles.includes(user.role.name),
    );

    const userRoleName = user.role?.name;

    if (!userRoleName || !allowedRoles.includes(userRoleName)) {
      return res.status(403).json({
        msg: "Access denied - Insufficient role",
        yourRole: userRoleName || "NO_ROLE",
        required: allowedRoles,
      });
    }

    req.user.roleName = userRoleName;
    next();
  } catch (error) {
    console.error("Role middleware error:", error);
    return res.status(500).json({ msg: "Server error in role check" });
  }
};
auth middleware;const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id) 
      .populate("role", "name")                 
      .select("-password");                     

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ msg: "Account is deactivated" });
    }

    req.user = user;  
    next();

  } catch (err) {
    console.error("Auth middleware error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }
    res.status(401).json({ msg: "Authentication failed" });
  }
};
user controller;// controllers/userController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const sendEmail = require("../utils/sendEmail");
const { requestApproval } = require("./approvalController"); 
const Approval = require("../models/Approval");
const notification = require("../services/notification");

const forwardToApproval = async (req, res, actionType, payload) => {
  req.body = { actionType, payload };
  return requestApproval(req, res);
};

exports.requestCreateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, username, role } = req.body;

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      username,
      role,
      createdBy: req.user.id,
    };

    return forwardToApproval(req, res, "CREATE_USER", payload);
  } catch (error) {
    console.error("requestCreateUser error:", error);
    res.status(500).json({
      message: "Failed to request user creation",
      error: error.message,
    });
  }
};
exports.getOrganizationUsers = async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organization })
      .select("firstName lastName username _id")
      .sort({ firstName: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.requestEditUser = async (req, res) => {
  try {
    const payload = {
      userId: req.params.id,
      updates: req.body,
    };
    return forwardToApproval(req, res, "EDIT_USER", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to create edit request" });
  }
};

exports.requestDeactivateUser = async (req, res) => {
  try {
    const payload = { userId: req.params.id };
    return forwardToApproval(req, res, "DEACTIVATE_USER", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to create deactivation request" });
  }
};

exports.requestRestoreUser = async (req, res) => {
  try {
    const approval = await Approval.create({
      actionType: "RESTORE_USER",
      payload: { userId: req.params.id },
      requestedBy: req.user.id,
    });

    // EMIT TO SUPER_ADMINs
    notification.notifySuperAdmins("approval:new", {
      approvalId: approval._id,
      actionType: "RESTORE_USER",
      requestedBy: {
        id: req.user.id,
        username: req.user.username || "Admin"
      },
      createdAt: approval.createdAt,
      userId: req.params.id,
    });

    res.json({ msg: "Restore request sent for approval" });
  } catch (err) {
    console.error("requestRestoreUser error:", err);
    res.status(500).json({ msg: "Failed to send restore request" });
  }
};
auth controller;const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || !user.isActive)
    return res.status(401).json({ msg: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ msg: "Invalid credentials" });

  const otp = generateOtp();
  await Otp.create({
    userId: user._id,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60000),
  });

  await sendEmail(user.email, "Your Login OTP", `<h3>Your OTP: ${otp}</h3>`);

  res.json({ msg: "OTP sent to email", userId: user._id });
};

exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  const record = await Otp.findOne({ userId, otp });
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  await Otp.deleteMany({ userId });

  // IMPORTANT: Fetch the full user with populated role
  const user = await User.findById(userId).populate("role");

  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role, 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.json({ token });
};
approval controller;// controllers/approvalController.js
const Approval = require("../models/Approval");
const executor = require("../services/approvalExecutor");
const AuditLog = require("../models/AuditLog");
const sendEmail = require("../utils/sendEmail");
const notification = require("../services/notification");
const Role = require("../models/Role");
const User = require("../models/User");

exports.requestApproval = async (req, res) => {
  const { actionType, payload } = req.body;

  try {
    const approval = await Approval.create({
      actionType,
      payload,
      requestedBy: req.user.id,
      status: "PENDING",
    });

    // Populate for better notification
    const populated = await Approval.findById(approval._id).populate(
      "requestedBy",
      "username email",
    );

    const notifyPayload = {
      approvalId: approval._id,
      actionType: approval.actionType,
      requestedBy: {
        id: req.user.id,
        username:
          populated.requestedBy?.username || req.user.username || "Admin",
      },
      createdAt: approval.createdAt.toISOString(),
      payloadSummary: payload.userId
        ? `User: ${payload.userId}`
        : JSON.stringify(payload),
    };

    // Notify SUPER_ADMINs via socket
    notification.notifySuperAdmins("approval:new", notifyPayload);

    // Email to all super admins
    const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
    if (superAdminRole) {
      const superAdmins = await User.find({ role: superAdminRole._id }).select(
        "email",
      );
      const emails = superAdmins.map((sa) => sa.email).filter(Boolean);
      if (emails.length > 0) {
        await sendEmail(
          emails.join(","),
          `New Approval Request: ${actionType.replace(/_/g, " ")}`,
          `<p>A new request needs your approval:</p>
           <ul>
             <li>Type: ${actionType}</li>
             <li>Requested by: ${populated.requestedBy?.username || "Admin"} (${populated.requestedBy?.email})</li>
             <li>Details: ${notifyPayload.payloadSummary}</li>
           </ul>
           <p>Review in the approvals page.</p>`,
        );
      }
    }

    res.status(201).json({
      message: "Approval request submitted",
      approvalId: approval._id,
    });
  } catch (err) {
    console.error("requestApproval error:", err);
    res.status(500).json({ message: "Failed to create approval request" });
  }
};

exports.reviewApproval = async (req, res) => {
  try {
    const approval = await Approval.findById(req.params.id).populate(
      "requestedBy",
      "email username",
    );

    if (!approval || approval.status !== "PENDING") {
      return res
        .status(400)
        .json({ msg: "Invalid or already processed approval" });
    }

    const { status } = req.body;
    if (!["APPROVED", "DENIED"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    let executedResult;
    if (status === "APPROVED") {
      executedResult = await executor.execute(approval);
    }

    approval.status = status;
    approval.reviewedBy = req.user.id;
    approval.reviewedAt = new Date();
    await approval.save();

    // Email to requester
    await sendEmail(
      approval.requestedBy.email,
      `Your Approval Request - ${status}`,
      `<p>Your ${approval.actionType.replace(/_/g, " ")} request was <strong>${status}</strong>.</p>`,
    );

   

    // Real-time update to requester
    notification.notifyUser(approval.requestedBy._id, "approval:status", {
      approvalId: approval._id,
      actionType: approval.actionType,
      status,
      reviewedAt: approval.reviewedAt.toISOString(),
    });

    // Audit log
    await AuditLog.create({
      action: `${approval.actionType}_${status}`,
      performedBy: req.user.id,
      targetUser: approval.payload?.userId || executedResult?._id,
      status,
      metadata: {
        approvalId: approval._id,
      },
    });

    res.json({ msg: `Request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("reviewApproval error:", err);
    res.status(500).json({ msg: "Failed to process approval" });
  }
};

exports.getMyApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find({ requestedBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "username");
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch your approvals" });
  }
};
server.js;const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 
dns.setServers(['8.8.8.8', '1.1.1.1']);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedSuperAdmin = require("./utils/seedSuperAdmin");
const http = require("http");
const { initSocket } = require("./socket/socket");

const app = express();

// 
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);



app.use(express.json());

connectDB().then(() => {
  seedSuperAdmin();
  require("./utils/seedAccounts")();
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/approvals", require("./routes/approvalRoutes"));
app.use("/api/permissions", require("./routes/permissionRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/boq", require("./routes/boqRoutes"));
app.use("/api/boq-categories", require("./routes/boqCategoryRoutes"));
app.use("/api/boq-breakdown", require("./routes/boqBreakdownRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/bills", require("./routes/billRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/daily-reports", require("./routes/dailyReportRoutes"));


const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready at http://localhost:${PORT}`);
});

 approval executor;
 const User = require("../models/User");
 const bcrypt = require("bcryptjs");
 const sendEmail = require("../utils/sendEmail");
 const AuditLog = require("../models/AuditLog");
 const Transaction = require("../models/Transaction");
 const Invoice = require("../models/Invoice");
 const Bill = require("../models/Bill");
 const Payment = require("../models/Payment");
 const Project = require("../models/Project");
 const BoqItem = require("../models/BoqItem");
 const Contact = require("../models/Contact");
 
 
 module.exports.execute = async (approval) => {
   const { actionType, payload } = approval;
   let accountsCache = {};
 
   const getDefaultAccount = async (subType) => {
     if (accountsCache[subType]) return accountsCrowded[subType];
 
     const account = await Account.findOne({ subType }).lean();
     if (!account) {
       throw new Error(`Default account not found for subType: ${subType}. Please create one in Chart of Accounts.`);
     }
 
     accountsCache[subType] = account;
     return account;
   }
 
   switch (actionType) {
 
 
     case "CREATE_PAYMENT": {
       const payment = await Payment.create(payload);
 
       if (payment.status !== "DRAFT") {
         const arAccount = await getDefaultAccount("Accounts Receivable");
         const apAccount = await getDefaultAccount("Accounts Payable");
         const bankAccount = payment.account;
 
         const entries = [];
 
         if (payment.type === "RECEIVED") {
           // Debit Bank/Cash, Credit A/R
           entries.push({ account: bankAccount, debit: payment.amount, credit: 0 });
           entries.push({ account: arAccount._id, debit: 0, credit: payment.amount });
         } else {
           // Debit A/P, Credit Bank/Cash
           entries.push({ account: apAccount._id, debit: payment.amount, credit: 0 });
           entries.push({ account: bankAccount, debit: 0, credit: payment.amount });
         }
 
         const transaction = await Transaction.create({
           transactionNumber: `TXN-${payment.paymentNumber}`,
           transactionDate: payment.paymentDate,
           reference: payment.paymentNumber,
           description: `${payment.type === "RECEIVED" ? "Payment received from" : "Payment made to"} ${payment.contact.displayName || "Contact"}`,
           sourceType: "PAYMENT",
           sourceId: payment._id,
           contact: payment.contact,
           entries,
           posted: true,
           postedBy: approval.reviewedBy,
           postedAt: new Date(),
         });
 
         payment.transaction = transaction._id;
         await payment.save();
 
 
       }
 
       await AuditLog.create({
         action: "PAYMENT_CREATED",
         performedBy: approval.reviewedBy,
         metadata: { paymentId: payment._id, paymentNumber: payment.paymentNumber, type: payment.type },
         status: "SUCCESS",
       });
 
       return payment;
     }
 
 
 
     case "SUBMIT_DAILY_REPORT": {
       const report = await DailySiteReport.findById(payload.reportId);
       if (!report) throw new Error("Report not found");
 
       report.status = "SUBMITTED";
       await report.save();
 
       return report;
     }
       case "REVIEW_DAILY_REPORT": {
         const report = await DailySiteReport.findById(payload.reportId);
         if (!report) throw new Error("Report not found");
 
         report.status = "REVIEWED";
         await report.save();
 
         return report;
     }
       
     case "SUBMIT_DAILY_REPORT": {
       const { reportId } = payload;
 
       if (!reportId) {
         throw new Error("Missing reportId in payload");
       }
 
       const report = await DailySiteReport.findById(reportId);
 
       if (!report) {
         throw new Error("Daily site report not found");
       }
 
       if (report.status !== "DRAFT" && report.status !== "SUBMITTED") {
         throw new Error(`Cannot process report in status: ${report.status}`);
       }
 
       // Optional: enforce final checks before marking as submitted
       // e.g. require at least some work description or photos
       if (!report.workDone?.trim()) {
         throw new Error("Work done description is required");
       }
 
       // Finalize submission
       report.status = "SUBMITTED";
       report.updatedAt = new Date(); // just in case
 
       await report.save();
 
       // Optional: create audit log entry for submission
       await AuditLog.create({
         action: "DAILY_REPORT_SUBMITTED",
         performedBy: approval.requestedBy,
         targetId: report._id,
         metadata: {
           projectId: report.project?.toString(),
           reportDate: report.reportDate,
         },
         status: "SUCCESS",
       });
 
       return report;
     }
 
 
 
 
     // ==================== BILL ACTIONS ====================
     case "CREATE_BILL":
     case "EDIT_BILL": {
       const data = actionType === "CREATE_BILL" ? payload : payload.updates;
       const bill = actionType === "CREATE_BILL"
         ? await Bill.create(data)
         : await Bill.findByIdAndUpdate(payload.billId, data, { new: true });
 
       if (bill.status !== "DRAFT") {
         const apAccount = await getDefaultAccount("Accounts Payable");
         const expenseEntries = bill.items.map(item => ({
           account: item.account,
           debit: item.amount,
           credit: 0,
         }));
 
         const transaction = await Transaction.create({
           transactionNumber: `TXN-${bill.billNumber}`,
           transactionDate: bill.billDate,
           reference: bill.billNumber,
           description: `Bill ${bill.billNumber} from ${bill.vendor.displayName || "Vendor"}`,
           sourceType: "BILL",
           sourceId: bill._id,
           contact: bill.vendor,
           entries: [
             ...expenseEntries,
             { account: apAccount._id, debit: 0, credit: bill.total },
           ],
           posted: true,
           postedBy: approval.reviewedBy,
           postedAt: new Date(),
           createdBy: approval.requestedBy,
         });
 
         bill.transaction = transaction._id;
         await bill.save();
       }
 
       await AuditLog.create({
         action: actionType === "CREATE_BILL" ? "BILL_CREATED" : "BILL_EDITED",
         performedBy: approval.reviewedBy,
         metadata: { billId: bill._id, billNumber: bill.billNumber },
         status: "SUCCESS",
       });
 
       return bill;
     }
 
     case "DELETE_BILL": {
       await Bill.findByIdAndUpdate(payload.billId, { status: "CANCELLED" });
       await AuditLog.create({
         action: "BILL_CANCELLED",
         performedBy: approval.reviewedBy,
         metadata: { billId: payload.billId },
         status: "SUCCESS",
       });
       return { cancelled: true };
     }
 
     case "CREATE_INVOICE":
     case "EDIT_INVOICE": {
       const data = actionType === "CREATE_INVOICE" ? payload : payload.updates;
       const invoice = actionType === "CREATE_INVOICE"
         ? await Invoice.create(data)
         : await Invoice.findByIdAndUpdate(payload.invoiceId, data, { new: true });
 
       if (invoice.status !== "DRAFT") {
         const transaction = await Transaction.create({
           transactionNumber: `TXN-${invoice.invoiceNumber}`,
           transactionDate: invoice.invoiceDate,
           reference: invoice.invoiceNumber,
           description: `Invoice ${invoice.invoiceNumber} to ${invoice.customer.displayName || 'Customer'}`,
           sourceType: "INVOICE",
           sourceId: invoice._id,
           contact: invoice.customer,
           entries: [
             { account: await getAccountByType("Accounts Receivable"), debit: invoice.total, credit: 0 },
             ...invoice.items.map(item => ({
               account: item.account,
               debit: 0,
               credit: item.amount,
             })),
           ],
           posted: true,
           postedBy: approval.reviewedBy,
           postedAt: new Date(),
           createdBy: approval.requestedBy,
         });
 
         invoice.transaction = transaction._id;
         await invoice.save();
       }
 
       await AuditLog.create({
         action: actionType === "CREATE_INVOICE" ? "INVOICE_CREATED" : "INVOICE_EDITED",
         performedBy: approval.reviewedBy,
         targetUser: null,
         metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
         status: "SUCCESS",
       });
 
       return invoice;
     }
 
     case "DELETE_INVOICE": {
       await Invoice.findByIdAndUpdate(payload.invoiceId, { status: "CANCELLED" });
       await AuditLog.create({
         action: "INVOICE_DELETED",
         performedBy: approval.reviewedBy,
         metadata: { invoiceId: payload.invoiceId },
       });
       return { deleted: true };
     }
 
     // ==================== CONTACT ACTIONS ====================
     case "CREATE_CONTACT": {
       const contact = await Contact.create(payload);
 
       await AuditLog.create({
         action: "CONTACT_CREATED",
         performedBy: approval.reviewedBy || approval.requestedBy,
         metadata: { contactId: contact._id, displayName: contact.displayName, type: contact.type },
         status: "SUCCESS",
       });
 
       return contact;
     }
 
     case "EDIT_CONTACT": {
       const updated = await Contact.findByIdAndUpdate(
         payload.contactId,
         payload.updates,
         { new: true }
       );
 
       await AuditLog.create({
         action: "CONTACT_EDITED",
         performedBy: approval.reviewedBy,
         metadata: { contactId: payload.contactId },
         status: "SUCCESS",
       });
 
       return updated;
     }
 
     case "DELETE_CONTACT": {
       const contact = await Contact.findById(payload.contactId);
       if (!contact) throw new Error("Contact not found");
 
       await Contact.findByIdAndUpdate(payload.contactId, { isActive: false });
 
       await AuditLog.create({
         action: "CONTACT_DELETED",
         performedBy: approval.reviewedBy,
         metadata: { contactId: payload.contactId, displayName: contact.displayName },
         status: "SUCCESS",
       });
 
       return { deleted: true };
     }
     case "CREATE_ACCOUNT": {
       const account = await Account.create({
         ...payload,
       });
 
       await AuditLog.create({
         action: "ACCOUNT_CREATED",
         performedBy: approval.reviewedBy || approval.requestedBy,
         metadata: { accountId: account._id, accountName: account.name },
         status: "SUCCESS",
       });
 
       return account;
     }
 
     case "EDIT_ACCOUNT": {
       const updated = await Account.findByIdAndUpdate(
         payload.accountId,
         payload.updates,
         { new: true }
       );
 
       await AuditLog.create({
         action: "ACCOUNT_EDITED",
         performedBy: approval.reviewedBy,
         metadata: { accountId: payload.accountId },
         status: "SUCCESS",
       });
 
       return updated;
     }
 
     case "DELETE_ACCOUNT": {
       const account = await Account.findById(payload.accountId);
       if (!account) throw new Error("Account not found");
 
       await Account.findByIdAndUpdate(payload.accountId, { isActive: false });
 
       await AuditLog.create({
         action: "ACCOUNT_DELETED",
         performedBy: approval.reviewedBy,
         metadata: { accountId: payload.accountId, accountName: account.name },
         status: "SUCCESS",
       });
 
       return { deleted: true };
     }
     case "CREATE_USER": {
       const tempPassword = Math.random().toString(36).slice(-8);
       const hashed = await bcrypt.hash(tempPassword, 10);
 
       const newUser = await User.create({
         ...payload,
         password: hashed,
         isActive: true,
       });
 
       const loginLink = `${process.env.BASE_URL}/login`;
       await sendEmail(
         newUser.email,
         "Your Account Has Been Activated",
         `<p>Hello ${newUser.firstName},</p>
          <p>Your account has been successfully activated.</p>
          <p><strong>Username:</strong> ${newUser.username}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p><a href="${loginLink}">Click here to login</a></p>
          <p>Please change your password immediately after logging in.</p>`,
       );
 
       await AuditLog.create({
         action: "USER_CREATED",
         performedBy: approval.reviewedBy || approval.requestedBy,
         targetUser: newUser._id,
         status: "SUCCESS",
       });
 
       return newUser;
     }
 
     case "EDIT_USER": {
       const updated = await User.findByIdAndUpdate(
         payload.userId,
         payload.updates,
         { new: true },
       );
 
       await AuditLog.create({
         action: "USER_EDITED",
         performedBy: approval.reviewedBy,
         targetUser: payload.userId,
         status: "SUCCESS",
       });
 
       return updated;
     }
 
     case "DEACTIVATE_USER": {
       const user = await User.findById(payload.userId).populate("role");
       if (user.role.name === "SUPER_ADMIN") {
         throw new Error("Cannot deactivate SUPER_ADMIN");
       }
 
       const deactivated = await User.findByIdAndUpdate(
         payload.userId,
         { isActive: false, deletedAt: new Date() },
         { new: true },
       );
 
       await AuditLog.create({
         action: "USER_DEACTIVATED",
         performedBy: approval.reviewedBy,
         targetUser: payload.userId,
         status: "SUCCESS",
       });
 
       return deactivated;
     }
 
     case "RESTORE_USER": {
       const restored = await User.findByIdAndUpdate(
         payload.userId,
         { isActive: true, deletedAt: null },
         { new: true },
       );
 
       await AuditLog.create({
         action: "USER_RESTORED",
         performedBy: approval.reviewedBy,
         targetUser: payload.userId,
         status: "SUCCESS",
       });
 
       return restored;
     }
 
     // ==================== PROJECT ACTIONS ====================
     case "CREATE_PROJECT": {
       const project = await Project.create({
         ...payload,
         createdBy: approval.requestedBy,
       });
 
       await AuditLog.create({
         action: "PROJECT_CREATED",
         performedBy: approval.reviewedBy || approval.requestedBy,
         metadata: { projectId: project._id, projectName: project.name },
         status: "SUCCESS",
       });
 
       return project;
     }
 
     case "EDIT_PROJECT": {
       const updated = await Project.findByIdAndUpdate(
         payload.projectId,
         payload.updates,
         { new: true },
       );
 
       await AuditLog.create({
         action: "PROJECT_EDITED",
         performedBy: approval.reviewedBy,
         metadata: { projectId: payload.projectId },
         status: "SUCCESS",
       });
 
       return updated;
     }
 
     case "DELETE_PROJECT": {
       const project = await Project.findById(payload.projectId);
       if (!project) throw new Error("Project not found");
 
       await BoqItem.deleteMany({ project: payload.projectId });
       await Project.deleteOne({ _id: payload.projectId });
 
       await AuditLog.create({
         action: "PROJECT_DELETED",
         performedBy: approval.reviewedBy,
         metadata: { projectId: payload.projectId, projectName: project.name },
         status: "SUCCESS",
       });
 
       return { deleted: true };
     }
 
     // ==================== BOQ ITEM ACTIONS (Optional Approval) ====================
     case "CREATE_BOQ_ITEM": {
       const item = await BoqItem.create({
         ...payload,
         createdBy: approval.requestedBy,
       });
 
       await AuditLog.create({
         action: "BOQ_ITEM_CREATED",
         performedBy: approval.reviewedBy || approval.requestedBy,
         metadata: { projectId: payload.project, boqItemId: item._id },
         status: "SUCCESS",
       });
 
       return item;
     }
 
     case "EDIT_BOQ_ITEM": {
       const updated = await BoqItem.findByIdAndUpdate(
         payload.itemId,
         payload.updates,
         { new: true },
       );
 
       await AuditLog.create({
         action: "BOQ_ITEM_EDITED",
         performedBy: approval.reviewedBy,
         metadata: { boqItemId: payload.itemId },
         status: "SUCCESS",
       });
 
       return updated;
     }
 
     case "DELETE_BOQ_ITEM": {
       const item = await BoqItem.findById(payload.itemId);
       if (!item) throw new Error("BOQ item not found");
 
       await BoqItem.deleteOne({ _id: payload.itemId });
 
       await AuditLog.create({
         action: "BOQ_ITEM_DELETED",
         performedBy: approval.reviewedBy,
         metadata: { boqItemId: payload.itemId },
         status: "SUCCESS",
       });
 
       return { deleted: true };
     }
 
     default:
       throw new Error(`Unknown approval action: ${actionType}`);
   }
 };
 upload.js;const multer = require('multer');
 const cloudinary = require('cloudinary').v2;
 const { CloudinaryStorage } = require('multer-storage-cloudinary');
 
 cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET,
 });
 
 const storage = new CloudinaryStorage({
     cloudinary,
     params: (req, file) => {
         return {
             folder: `construction-reports/${req.user.organization || 'default'}`,
             allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
             public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
         };
     },
 });
 
 
 
 const upload = multer({
     storage,
     limits: { fileSize: 10 * 1024 * 1024 },
     fileFilter: (req, file, cb) => {
         if (file.mimetype.match(/image|pdf/)) {
             cb(null, true);
         } else {
             cb(new Error('Only images and PDFs allowed'), false);
         }
     },
 });
 
 module.exports = {
     uploadSingle: upload.single('file'),
     uploadMultiple: upload.array('files', 10),
 };
 i will give you my front end code  later,,, 

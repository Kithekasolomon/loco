//i want the client to be able to also assign available technician,,if they dont assign a technician, the admin can assign the technician..also i want to see the part where the technician gives an update on the progress and if its done he updates the status to done and the client has to confirm fisrt and say that they paid the service fee and the admin has to approve, you can seed some technician in the system, lets start with the backend intergration first then we will move to the front end later on; this is my user model;const mongoose = require("mongoose");

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

service request update model;
const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // technician
    message: { type: String, required: true },
    images: [{ type: String }],                    // cloudinary urls
    statusAtUpdate: { type: String, enum: ['IN_PROGRESS', 'READY_FOR_COMPLETION'] },
}, { timestamps: true });

module.exports = mongoose.model('ServiceRequestUpdate', updateSchema);

service request mongoose.model;const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },

    serviceType: {
        type: String,
        required: true,
        trim: true,
    }, 

    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: String,                   
    price: Number,                  

    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },

    image: String,                  

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    reviewComment: String,
    reviewedAt: Date,

    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancellationReason: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);

service model;const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: String,
    category: String,               
    basePrice: {
        type: Number,
        min: 0,
    },
    image: String,                 
    isActive: {
        type: Boolean,
        default: true,
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);

organization mongoose.model; const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    currency: { type: String, default: "USD" },
    fiscalYearStart: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);

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
user controller;const bcrypt = require("bcryptjs");
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
 
approval executor service;
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

upload route const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/upload'); 
router.post(
    '/service-request-image',
    auth,
    (req, res, next) => {
        uploadSingle(req, res, function (err) {
            if (err) {
                // Multer-specific errors come here first
                console.error('Multer error during upload:');
                console.error('Error name:', err.name);
                console.error('Error message:', err.message);
                console.error('Full error:', JSON.stringify(err, null, 2)); 
                console.error('Stack:', err.stack);

                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'File too large (max 10MB)' });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({ message: 'Unexpected field name – must be "file"' });
                }

                return res.status(400).json({
                    message: err.message || 'File upload rejected by multer',
                    code: err.code,
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            console.log('File successfully processed by multer:', {
                originalname: req.file?.originalname,
                mimetype: req.file?.mimetype,
                size: req.file?.size,
                path: req.file?.path,
                filename: req.file?.filename,
            });

            if (!req.file) {
                return res.status(400).json({ message: 'No file received' });
            }

            if (!req.file.path) {
                console.error('Cloudinary did not return a path!');
                return res.status(500).json({ message: 'Upload succeeded but no URL returned from Cloudinary' });
            }

            res.status(200).json({
                success: true,
                url: req.file.path,           
                public_id: req.file.filename, 
            });
        } catch (err) {
            console.error('Post-multer upload error:');
            console.error('Name:', err.name);
            console.error('Message:', err.message);
            console.error('Stack:', err.stack || 'No stack');
            const safeErr = {
                name: err.name,
                message: err.message,
                code: err.code,
                http_code: err.http_code,
            };
            res.status(500).json({
                message: 'Server error during image processing',
                error: safeErr,
            });
        }
    }
);

module.exports = router;
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
service routes;const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');

router.get('/services', auth, async (req, res) => {
    try {
        const services = await Service.find({
            organization: req.user.organization,
            isActive: true,
        })
            .select('name slug description category basePrice image')
            .sort('name');
        res.json(services);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load services' });
    }
});

// ─── My service requests ───
router.get('/requests', auth, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({
            user: req.user._id,
            organization: req.user.organization,
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load requests' });
    }
});

// ─── Create new request ───
// POST /api/requests
router.post('/requests', auth, async (req, res) => {
    try {
        if (!req.user.organization) {
            return res.status(403).json({
                message: "User is not associated with any organization. Contact admin."
            });
        }

        const {
            serviceType,
            description,
            location,
            date,
            time,
            price,
            image,
        } = req.body;

        const request = await ServiceRequest.create({
            user: req.user._id,
            organization: req.user.organization,
            serviceType,
            description,
            location,
            date,
            time,
            price: price || undefined,
            image: image || undefined,
            createdBy: req.user._id,
        });

        res.status(201).json(request);
    } catch (err) {
        console.error("[CREATE REQUEST ERROR]", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation failed",
                errors: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: "Server error creating request" });
    }
});

// ─── Get single request (view) ───
router.get('/requests/:id', auth, async (req, res) => {
    try {
        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!request) return res.status(404).json({ message: 'Request not found' });

        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Cancel (only if not completed/rejected) ───
router.patch('/requests/:id/cancel', auth, async (req, res) => {
    try {
        const { reason } = req.body;

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!request) return res.status(404).json({ message: 'Not found' });

        if (!['PENDING', 'CONFIRMED'].includes(request.status)) {
            return res.status(400).json({ message: 'Cannot cancel this request anymore' });
        }

        request.status = 'CANCELLED';
        request.cancelledBy = req.user._id;
        request.cancelledAt = new Date();
        request.cancellationReason = reason?.trim() || undefined;
        request.updatedBy = req.user._id;

        await request.save();

        res.json({ message: 'Request cancelled', request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ─── Mark as completed (user confirms job is done) ───
router.patch('/requests/:id/complete', auth, async (req, res) => {
    try {
        const { rating, reviewComment } = req.body;

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!request) return res.status(404).json({ message: 'Not found' });

        if (request.status !== 'IN_PROGRESS' && request.status !== 'CONFIRMED') {
            return res.status(400).json({ message: 'Can only confirm completed jobs' });
        }

        request.status = 'COMPLETED';
        request.rating = rating ? Math.round(rating) : undefined;

        request.reviewComment = reviewComment?.trim() || undefined;
        request.reviewedAt = new Date();
        request.updatedBy = req.user._id;

        await request.save();

        res.json({ message: 'Job marked as completed', request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;

service request admin routes;// routes/serviceRequestAdminRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const ServiceRequestUpdate = require('../models/ServiceRequestUpdate');
const { uploadSingle, uploadMultiple } = require('../middleware/upload'); 

// Allowed roles: adjust according to your role names
const PROVIDER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PROVIDER', 'TECHNICIAN'];

// ─── List ALL service requests in the organization ───
// Useful for dashboard / admin panel
router.get('/admin/requests', auth, role(PROVIDER_ROLES), async (req, res) => {
    try {
        const { status, assignedTo, search } = req.query;

        const filter = { organization: req.user.organization };

        if (status) filter.status = status;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (search) {
            filter.$or = [
                { serviceType: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
            ];
        }

        const requests = await ServiceRequest.find(filter)
            .populate('user', 'firstName lastName email phone')
            .populate('assignedTo', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load requests' });
    }
});

// ─── Assign / Re-assign technician ───
router.patch(
    '/admin/requests/:id/assign',
    auth,
    role(PROVIDER_ROLES),
    async (req, res) => {
        try {
            const { assignedTo } = req.body; 

            if (!assignedTo) {
                return res.status(400).json({ message: 'assignedTo (user ID) is required' });
            }

            const technician = await User.findOne({
                _id: assignedTo,
                organization: req.user.organization,
                isActive: true,
                // Optional: check role if you have technician-specific roles
                // role: { $in: [...] }
            });

            if (!technician) {
                return res.status(400).json({ message: 'Invalid or inactive technician' });
            }

            const request = await ServiceRequest.findOneAndUpdate(
                {
                    _id: req.params.id,
                    organization: req.user.organization,
                },
                {
                    assignedTo: assignedTo,
                    updatedBy: req.user._id,
                    // Optional: auto-set status when first assigned
                    $setOnInsert: { status: 'CONFIRMED' },
                },
                { new: true, runValidators: true }
            ).populate('assignedTo', 'firstName lastName');

            if (!request) return res.status(404).json({ message: 'Request not found' });

            res.json({
                message: `Assigned to ${technician.firstName || technician.username}`,
                request,
            });
        } catch (err) {
            res.status(400).json({ message: err.message || 'Assignment failed' });
        }
    }
);

// ─── Update status (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED, etc.) ───
router.patch(
    '/admin/requests/:id/status',
    auth,
    role(PROVIDER_ROLES),
    async (req, res) => {
        try {
            const { status, note } = req.body;

            const allowedTransitions = {
                PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
                CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'REJECTED'],
                IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
                COMPLETED: [],
                CANCELLED: [],
                REJECTED: [],
            };

            const request = await ServiceRequest.findOne({
                _id: req.params.id,
                organization: req.user.organization,
            });

            if (!request) return res.status(404).json({ message: 'Request not found' });

            if (!status || !allowedTransitions[request.status]?.includes(status)) {
                return res.status(400).json({
                    message: `Cannot change status from ${request.status} to ${status}`,
                });
            }

            request.status = status;
            request.updatedBy = req.user._id;

            // Optional: add internal note / history
            if (note?.trim()) {
                request.internalNote = (request.internalNote || '') + `\n${new Date().toISOString()} - ${status}: ${note}`;
            }

            await request.save();

            res.json({ message: `Status updated to ${status}`, request });
        } catch (err) {
            res.status(400).json({ message: err.message || 'Status update failed' });
        }
    }
);

// ─── Update price (e.g. after site visit / final quote) ───
router.patch(
    '/admin/requests/:id/price',
    auth,
    role(PROVIDER_ROLES),
    async (req, res) => {
        try {
            const { price } = req.body;

            if (typeof price !== 'number' || price < 0) {
                return res.status(400).json({ message: 'Valid non-negative price required' });
            }

            const request = await ServiceRequest.findOneAndUpdate(
                {
                    _id: req.params.id,
                    organization: req.user.organization,
                },
                {
                    price,
                    updatedBy: req.user._id,
                },
                { new: true }
            );

            if (!request) return res.status(404).json({ message: 'Request not found' });

            res.json({ message: 'Price updated', request });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

// Technician marks job as in progress
router.patch('/admin/requests/:id/start', auth, role(PROVIDER_ROLES), async (req, res) => {
    const request = await ServiceRequest.findOneAndUpdate(
        { _id: req.params.id, organization: req.user.organization },
        { status: 'IN_PROGRESS', updatedBy: req.user._id },
        { new: true }
    );
    res.json(request);
});


router.post(
    '/admin/requests/:id/update',
    auth,
    role(PROVIDER_ROLES),
    uploadMultiple,   // now correctly imported
    async (req, res) => {
        try {
            const { message, markAsReady } = req.body;
            const images = req.files ? req.files.map(f => f.path) : [];

            if (!message?.trim()) {
                return res.status(400).json({ message: 'Message is required' });
            }

            const update = await ServiceRequestUpdate.create({
                request: req.params.id,
                user: req.user._id,
                message: message.trim(),
                images,
                statusAtUpdate: 'IN_PROGRESS',
            });

            let request = await ServiceRequest.findById(req.params.id);

            if (markAsReady === 'true' || markAsReady === true) {
                request.status = 'READY_FOR_COMPLETION';
                request.updatedBy = req.user._id;
                await request.save();
            }

            // Optional: populate for response
            const populatedUpdate = await ServiceRequestUpdate.findById(update._id)
                .populate('user', 'firstName lastName username');

            res.json({
                success: true,
                update: populatedUpdate,
                request,
            });
        } catch (err) {
            console.error('Progress update error:', err);
            res.status(500).json({ message: 'Failed to save update', error: err.message });
        }
    }
);

// Technician marks ready for client confirmation
router.patch('/admin/requests/:id/ready', auth, role(PROVIDER_ROLES), async (req, res) => {
    const request = await ServiceRequest.findOneAndUpdate(
        { _id: req.params.id, organization: req.user.organization },
        { status: 'READY_FOR_COMPLETION', updatedBy: req.user._id },
        { new: true }
    );
    res.json(request);
});

// List all progress updates for a specific request
router.get('/admin/requests/:id/updates', auth, role(PROVIDER_ROLES), async (req, res) => {
    try {
        const updates = await ServiceRequestUpdate.find({
            request: req.params.id,
          
        })
            .populate('user', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .lean();

        res.json(updates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to load updates' });
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
 
assignOrgToUsers utils;const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']);


const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Organization = require('../models/Organization');

async function assignOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const org = await Organization.findOne();
        if (!org) {
            console.log('No organization found. Create one first.');
            process.exit(1);
        }

        console.log('Assigning organization ID:', org._id.toString());

        const result = await User.updateMany(
            { organization: { $exists: false } }, 
            { $set: { organization: org._id } }
        );

        console.log('Updated users:', result.modifiedCount);
    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        mongoose.connection.close();
    }
}

assignOrg();
seedOrganization;const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const Organization = require('../models/Organization');
require('dotenv').config();

async function seedOrganization() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existing = await Organization.findOne({ name: 'Demo Organization' });

        if (existing) {
            console.log('Demo organization already exists → ID:', existing._id);
            process.exit(0);
        }

        const org = await Organization.create({
            name: 'Demo Organization',
            currency: 'KES',
            fiscalYearStart: new Date('2025-01-01'),
            createdBy: null, 
        });

        console.log('Created demo organization:');
        console.log('ID:', org._id.toString());
        console.log('Name:', org.name);
        console.log('Currency:', org.currency);

    } catch (err) {
        console.error('Organization seeding failed:', err.message);
    } finally {
        mongoose.connection.close();
    }
}

seedOrganization();
seed service;const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']); const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const dummyServices = [
    {
        name: 'Plumbing Repair',
        slug: 'plumbing-repair',
        description: 'Fix leaks, unclog drains, install fixtures',
        category: 'Plumbing',
        basePrice: 3500,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/plumbing.jpg',
    },
    {
        name: 'Electrical Installation',
        slug: 'electrical-installation',
        description: 'Wiring, socket installation, lighting',
        category: 'Electrical',
        basePrice: 4500,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/electrical.jpg',
    },
    {
        name: 'AC Repair & Service',
        slug: 'ac-repair',
        description: 'Cleaning, gas refill, compressor repair',
        category: 'Air Conditioning',
        basePrice: 6000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/ac-repair.jpg',
    },
    {
        name: 'House Cleaning',
        slug: 'house-cleaning',
        description: 'Deep cleaning, post-construction cleanup',
        category: 'Cleaning',
        basePrice: 8000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/cleaning.jpg',
    },
    {
        name: 'Painting Services',
        slug: 'painting',
        description: 'Interior & exterior painting',
        category: 'Painting',
        basePrice: 12000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/painting.jpg',
    },
];

async function seedServices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Get first organization (or hardcode one for dev)
        const firstOrg = await mongoose.connection.db.collection('organizations').findOne();
        if (!firstOrg) {
            console.log('No organization found. Create one first.');
            process.exit(1);
        }

        const orgId = firstOrg._id;

        for (const svc of dummyServices) {
            await Service.findOneAndUpdate(
                { slug: svc.slug, organization: orgId },
                { ...svc, organization: orgId, isActive: true },
                { upsert: true, new: true }
            );
            console.log(`Upserted: ${svc.name}`);
        }

        console.log('Dummy services seeded successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedServices();
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

require("./models/User");
require("./models/Organization");          // ← must come early
require("./models/Role");
require("./models/Approval");
require("./models/Otp");
require("./models/Service");               // if you have it
require("./models/ServiceRequest");

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
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api', require('./routes/serviceRoutes'));
app.use('/api', require('./routes/serviceRequestAdminRoutes'));
app.use('/api', require('./routes/serviceRequestRoutes'));


const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready at http://localhost:${PORT}`);
});

 
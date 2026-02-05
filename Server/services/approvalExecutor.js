
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


    case "ASSIGN_TECHNICIAN": {
      const { requestId, assignedTo } = payload;

      const request = await ServiceRequest.findById(requestId);
      if (!request) throw new Error("Service request not found");

      request.assignedTo = assignedTo;
      request.status = request.status === 'PENDING' ? 'CONFIRMED' : request.status;
      request.updatedBy = approval.reviewedBy;
      await request.save();

      await AuditLog.create({
        action: "TECHNICIAN_ASSIGNED",
        performedBy: approval.reviewedBy,
        targetId: request._id,
        metadata: { assignedTo, requestId },
        status: "SUCCESS",
      });

      return request;
    }

    case "MARK_READY_FOR_COMPLETION": {
      const { requestId } = payload;

      const request = await ServiceRequest.findById(requestId);
      if (!request) throw new Error("Service request not found");

      if (request.status !== 'IN_PROGRESS') {
        throw new Error("Can only mark IN_PROGRESS requests as ready");
      }

      request.status = 'READY_FOR_COMPLETION';
      request.updatedBy = approval.reviewedBy;
      await request.save();

      await AuditLog.create({
        action: "REQUEST_READY_FOR_COMPLETION",
        performedBy: approval.reviewedBy,
        targetId: request._id,
        status: "SUCCESS",
      });

      return request;
    }

    case "CONFIRM_COMPLETION": {
      const { requestId, paymentProofImage, paymentMethod, transactionRef, note } = payload;

      const request = await ServiceRequest.findById(requestId);
      if (!request) throw new Error("Service request not found");

      if (request.status !== 'READY_FOR_COMPLETION') {
        throw new Error("Can only confirm READY_FOR_COMPLETION requests");
      }

      request.status = 'COMPLETED';
      request.clientConfirmedPayment = true;
      request.clientConfirmationNote = note;
      request.completedByClient = approval.requestedBy; // client who requested approval
      request.clientConfirmedAt = new Date();

      if (paymentProofImage) request.paymentProofImage = paymentProofImage;
      if (paymentMethod) request.paymentMethod = paymentMethod;
      if (transactionRef) request.transactionRef = transactionRef;

      request.updatedBy = approval.reviewedBy; // admin
      await request.save();

      await AuditLog.create({
        action: "REQUEST_COMPLETED_APPROVED",
        performedBy: approval.reviewedBy,
        targetId: request._id,
        status: "SUCCESS",
      });

      return request;
    }



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

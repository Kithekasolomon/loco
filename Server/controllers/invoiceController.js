const Invoice = require("../models/Invoice");
const Contact = require("../models/Contact");
const { generateInvoiceNumber } = require("../utils/generateNumber");
const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
    req.body = { actionType, payload };
    return requestApproval(req, res);
};

exports.createInvoice = async (req, res) => {
    try {
        const { customer, items, invoiceDate, dueDate, notes, terms } = req.body;

        const contact = await Contact.findById(customer);
        if (!contact || !["CUSTOMER", "BOTH"].includes(contact.type)) {
            return res.status(400).json({ message: "Invalid customer" });
        }

        const invoiceNumber = await generateInvoiceNumber();

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const total = subtotal;

        const payload = {
            invoiceNumber,
            customer,
            invoiceDate: invoiceDate || new Date(),
            dueDate,
            items: items.map(item => ({
                ...item,
                amount: item.quantity * item.rate,
            })),
            subtotal,
            total,
            notes,
            terms,
            status: "DRAFT",
            createdBy: req.user.id,
        };

        return forwardToApproval(req, res, "CREATE_INVOICE", payload);
    } catch (err) {
        console.error("createInvoice error:", err);
        res.status(500).json({ message: "Failed to request invoice creation" });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const payload = {
            invoiceId: req.params.id,
            updates: req.body,
        };
        return forwardToApproval(req, res, "EDIT_INVOICE", payload);
    } catch (err) {
        res.status(500).json({ message: "Failed to request update" });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const payload = { invoiceId: req.params.id };
        return forwardToApproval(req, res, "DELETE_INVOICE", payload);
    } catch (err) {
        res.status(500).json({ message: "Failed to request deletion" });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const { status, customer } = req.query;
        let query = {};
        if (status) query.status = status;
        if (customer) query.customer = customer;

        const invoices = await Invoice.find(query)
            .populate("customer", "displayName companyName email")
            .sort({ invoiceDate: -1 });

        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch invoices" });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("customer", "displayName companyName email billingAddress")
            .populate("items.account", "name accountCode");
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
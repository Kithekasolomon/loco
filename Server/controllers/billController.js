// controllers/billController.js
const Bill = require("../models/Bill");
const Contact = require("../models/Contact");
const { generateBillNumber } = require("../utils/generateNumber");
const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
    req.body = { actionType, payload };
    return requestApproval(req, res);
};

exports.createBill = async (req, res) => {
    try {
        const { vendor, items, billDate, dueDate, notes } = req.body;

        // Validate vendor
        const contact = await Contact.findById(vendor);
        if (!contact || !["VENDOR", "BOTH"].includes(contact.type)) {
            return res.status(400).json({ message: "Invalid vendor selected" });
        }

        const billNumber = await generateBillNumber();

        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
        const total = subtotal; // Add tax logic later if needed

        const payload = {
            billNumber,
            vendor,
            billDate: billDate || new Date(),
            dueDate,
            items: items.map(item => ({
                ...item,
                amount: item.quantity * item.rate,
            })),
            subtotal,
            total,
            notes,
            status: "DRAFT",
            createdBy: req.user.id,
        };

        return forwardToApproval(req, res, "CREATE_BILL", payload);
    } catch (err) {
        console.error("createBill error:", err);
        res.status(500).json({ message: "Failed to request bill creation" });
    }
};

exports.updateBill = async (req, res) => {
    try {
        const payload = {
            billId: req.params.id,
            updates: req.body,
        };
        return forwardToApproval(req, res, "EDIT_BILL", payload);
    } catch (err) {
        console.error("updateBill error:", err);
        res.status(500).json({ message: "Failed to request bill update" });
    }
};

exports.deleteBill = async (req, res) => {
    try {
        const payload = { billId: req.params.id };
        return forwardToApproval(req, res, "DELETE_BILL", payload);
    } catch (err) {
        res.status(500).json({ message: "Failed to request bill deletion" });
    }
};

exports.getBills = async (req, res) => {
    try {
        const { status, vendor } = req.query;
        let query = {};
        if (status) query.status = status;
        if (vendor) query.vendor = vendor;

        const bills = await Bill.find(query)
            .populate("vendor", "displayName companyName email")
            .sort({ billDate: -1 });

        res.json(bills);
    } catch (err) {
        console.error("getBills error:", err);
        res.status(500).json({ message: "Failed to fetch bills" });
    }
};

exports.getBillById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate("vendor", "displayName companyName email billingAddress")
            .populate("items.account", "name accountCode");

        if (!bill) return res.status(404).json({ message: "Bill not found" });
        res.json(bill);
    } catch (err) {
        console.error("getBillById error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Bill = require("../models/Bill");
const Contact = require("../models/Contact");
const { generatePaymentNumber } = require("../utils/generateNumber");
const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
    req.body = { actionType, payload };
    return requestApproval(req, res);
};

exports.createPayment = async (req, res) => {
    try {
        const {
            type,
            contact,
            amount,
            paymentDate,
            paymentMethod,
            reference,
            notes,
            appliedTo,
            account,
        } = req.body;

        const validContact = await Contact.findById(contact);
        if (!validContact) return res.status(400).json({ message: "Invalid contact" });

        const paymentNumber = await generatePaymentNumber(type);

        const payload = {
            paymentNumber,
            type,
            contact,
            amount,
            paymentDate: paymentDate || new Date(),
            paymentMethod,
            reference,
            notes,
            appliedTo,
            account,
            status: "DRAFT",
            createdBy: req.user.id,
        };

        return forwardToApproval(req, res, "CREATE_PAYMENT", payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to request payment" });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const { type, contact } = req.query;
        let query = {};
        if (type) query.type = type;
        if (contact) query.contact = contact;

        const payments = await Payment.find(query)
            .populate("contact", "displayName")
            .populate("account", "name")
            .sort({ paymentDate: -1 });

        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch payments" });
    }
};
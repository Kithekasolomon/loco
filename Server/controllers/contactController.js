const Contact = require("../models/Contact");
const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
    req.body = { actionType, payload };
    return requestApproval(req, res);
};

exports.createContact = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            createdBy: req.user.id,
        };
        return forwardToApproval(req, res, "CREATE_CONTACT", payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to request contact creation" });
    }
};

exports.updateContact = async (req, res) => {
    try {
        const payload = {
            contactId: req.params.id,
            updates: req.body,
        };
        return forwardToApproval(req, res, "EDIT_CONTACT", payload);
    } catch (err) {
        res.status(500).json({ message: "Failed to request contact update" });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const payload = { contactId: req.params.id };
        return forwardToApproval(req, res, "DELETE_CONTACT", payload);
    } catch (err) {
        res.status(500).json({ message: "Failed to request contact deletion" });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const { type, search } = req.query;
        let query = { isActive: true };

        if (type) query.type = type;
        if (search) {
            query.$or = [
                { displayName: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const contacts = await Contact.find(query)
            .sort({ displayName: 1 })
            .select("-notes -createdAt -updatedAt");

        res.json(contacts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch contacts" });
    }
};

exports.getContactById = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: "Contact not found" });
        res.json(contact);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
const ServiceRequest = require("../models/ServiceRequest");
const User = require("../models/User");
const Role = require("../models/Role");
const sendEmail = require("../utils/sendEmail");

exports.createServiceRequest = async (req, res) => {
    try {

        
        const {
            serviceType,
            productType,
            productBrand,
            specifics,
            problemType,
            expectedTimeline,
            comment,
            assignedTo,
            price,
        } = req.body;

        console.log("=== CREATE SERVICE REQUEST DEBUG ===");
        console.log("Logged-in user ID:", req.user._id.toString());
        console.log("Logged-in user org:", req.user.organization?.toString());
        console.log("Submitted assignedTo:", req.body.assignedTo);
        console.log("Full request body:", req.body);

        // Conditional validation
        if (serviceType === "REPAIR_MAINTENANCE" && !problemType) {
            return res.status(400).json({ msg: "Problem type required for repair" });
        }

        // Validate technician
        const technician = await User.findById(assignedTo).populate("role");

        console.log("Found technician:", technician ? technician._id.toString() : null);
        if (technician) {
            console.log("Technician org:", technician.organization?.toString());
            console.log("Technician role name:", technician.role?.name);
            console.log("Org match?", technician.organization?.toString() === req.user.organization?.toString());
            console.log("Role match?", technician.role?.name === "TECHNICIAN");
        }
        if (
            !technician ||
            // technician.organization.toString() !== req.user.organization.toString() ||
            technician.role.name !== "TECHNICIAN"
        ) {
            return res.status(400).json({ msg: "Invalid technician" });
        }

        const request = await ServiceRequest.create({
            client: req.user._id,
            serviceType,
            productType,
            productBrand,
            specifics,
            problemType,
            expectedTimeline,
            comment,
            assignedTo,
            price,
            organization: req.user.organization,
            history: [{ status: "PENDING", by: req.user._id, comment: "Request created" }],
        });

        // Emails
        const clientEmail = req.user.email;
        const techEmail = technician.email;
        const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
        const superAdmins = await User.find({ role: superAdminRole._id, organization: req.user.organization }).select("email");
        const adminEmails = superAdmins.map((u) => u.email);

        await sendEmail(clientEmail, "Request Created", `Your request ${request._id} is pending.`);
        await sendEmail(techEmail, "New Request", `Assigned request ${request._id}.`);
        for (const email of adminEmails) {
            await sendEmail(email, "New Request", `New request ${request._id}.`);
        }

        res.status(201).json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ client: req.user._id })
            .populate("assignedTo", "firstName lastName")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
};

exports.getTechnicianRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ assignedTo: req.user._id })
            .populate("client", "firstName lastName")
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ msg: "Server error" });
    }
};

exports.updateRequest = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const request = await ServiceRequest.findById(req.params.id).populate("client assignedTo");
        if (!request || request.assignedTo._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Unauthorized" });
        }

        if (status) request.status = status;
        request.history.push({ status: request.status, by: req.user._id, comment });
        await request.save();

        // Emails
        const updateMsg = `Request ${request._id} updated to ${status}. Comment: ${comment || "N/A"}.`;
        await sendEmail(request.client.email, "Request Update", updateMsg);
        await sendEmail(request.assignedTo.email, "Request Update", updateMsg);

        const superAdminRole = await Role.findOne({ name: "SUPER_ADMIN" });
        const superAdmins = await User.find({ role: superAdminRole._id, organization: req.user.organization }).select("email");
        for (const email of superAdmins.map((u) => u.email)) {
            await sendEmail(email, "Request Update", updateMsg);
        }

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
exports.getSingleRequest = async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id)
            .populate("client", "firstName lastName username email")
            .populate("assignedTo", "firstName lastName username email")
            .lean();

        if (!request) {
            return res.status(404).json({ msg: "Service request not found" });
        }

        // Optional: Access control
        const userId = req.user._id.toString();
        const isClient = request.client._id.toString() === userId;
        const isTechnician = request.assignedTo._id.toString() === userId;
        const isAdmin = req.user.roleName === "SUPER_ADMIN" || req.user.roleName === "ADMIN";

        if (!isClient && !isTechnician && !isAdmin) {
            return res.status(403).json({ msg: "You do not have permission to view this request" });
        }

        res.json(request);
    } catch (err) {
        console.error("getSingleRequest error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

exports.getTechnicianRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ assignedTo: req.user._id })
            .populate("client", "firstName lastName username email phone")
            .populate("assignedTo", "firstName lastName username email")
            .sort({ createdAt: -1 })
            .lean();

        res.json(requests);
    } catch (err) {
        console.error("getTechnicianRequests error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};
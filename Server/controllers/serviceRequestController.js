const ServiceRequest = require('../models/ServiceRequest');
const ServiceRequestUpdate = require('../models/ServiceRequestUpdate');
const Approval = require('../models/Approval');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { notifySuperAdmins, notifyUser } = require('../services/notification');

const allowedTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
    CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'REJECTED'],
    IN_PROGRESS: ['READY_FOR_COMPLETION', 'CANCELLED'],
    READY_FOR_COMPLETION: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
};

const sendClientEmail = async (client, subject, html) => {
    if (!client?.email) return;
    try {
        await sendEmail(client.email, subject, html);
    } catch (err) {
        console.error('Failed to send client email:', err);
    }
};

exports.requestAssignTechnician = async (req, res) => {
    try {
        const { requestId, assignedTo } = req.body;

        const request = await ServiceRequest.findById(requestId);
        if (!request || request.organization.toString() !== req.user.organization.toString()) {
            return res.status(404).json({ message: 'Service request not found' });
        }

        // Client can only request assignment if not yet assigned (or re-request)
        if (req.user.role?.name === 'CLIENT' && request.assignedTo && request.assignedTo.toString() !== assignedTo) {
            return res.status(403).json({ message: 'This request is already assigned. Contact support to re-assign.' });
        }

        const technician = await User.findById(assignedTo);
        if (!technician || technician.organization.toString() !== req.user.organization.toString() || !technician.isActive) {
            return res.status(400).json({ message: 'Invalid or inactive technician' });
        }

        const approval = await Approval.create({
            actionType: 'ASSIGN_TECHNICIAN',
            payload: { requestId, assignedTo },
            requestedBy: req.user._id,
            targetRequest: requestId,
        });

        // Notify admins
        notifySuperAdmins('approval:new', {
            approvalId: approval._id,
            action: 'ASSIGN_TECHNICIAN',
            requestId,
            requestedBy: req.user.username || req.user.email,
            technician: technician.username || technician.email,
        });

        // Email admins (optional – you can expand this)
        // await sendEmailToAdmins(...)

        res.status(201).json({
            message: 'Technician assignment request submitted for approval',
            approvalId: approval._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create assignment request' });
    }
};

// 2. Technician adds progress update + optionally requests "ready for completion"
exports.addProgressUpdate = async (req, res) => {
    try {
        const { message, markAsReady = false } = req.body;
        const images = req.files ? req.files.map(f => f.path) : [];

        if (!message?.trim()) {
            return res.status(400).json({ message: 'Update message is required' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.assignedTo?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this request' });
        }

        if (!['CONFIRMED', 'IN_PROGRESS'].includes(request.status)) {
            return res.status(400).json({ message: 'Cannot add updates in current status' });
        }

        const update = await ServiceRequestUpdate.create({
            request: request._id,
            user: req.user._id,
            message: message.trim(),
            images,
            statusAtUpdate: 'IN_PROGRESS',
        });

        // If technician wants to mark as ready → create approval request
        let approval = null;
        if (markAsReady === true || markAsReady === 'true') {
            approval = await Approval.create({
                actionType: 'MARK_READY_FOR_COMPLETION',
                payload: { requestId: request._id },
                requestedBy: req.user._id,
                targetRequest: request._id,
            });

            notifySuperAdmins('approval:new', {
                approvalId: approval._id,
                action: 'MARK_READY_FOR_COMPLETION',
                requestId: request._id,
                technician: req.user.username || req.user.email,
            });
        }

        // Notify client about new update
        const populatedUpdate = await ServiceRequestUpdate.findById(update._id)
            .populate('user', 'firstName lastName username');

        notifyUser(request.user, 'progress:new', {
            requestId: request._id,
            updateId: update._id,
            message: update.message.substring(0, 140) + (update.message.length > 140 ? '...' : ''),
            by: `${populatedUpdate.user.firstName} ${populatedUpdate.user.lastName}`,
            imagesCount: images.length,
            createdAt: update.createdAt,
        });

        // Email client (summary)
        const client = await User.findById(request.user).select('email firstName');
        await sendClientEmail(client, 'New update on your service request', `
      <p>Hello ${client.firstName},</p>
      <p>The technician has added a new update to your request:</p>
      <blockquote>${update.message.substring(0, 200)}${update.message.length > 200 ? '...' : ''}</blockquote>
      <p>View details: <a href="${process.env.CLIENT_URL}/requests/${request._id}">Open request</a></p>
      <p>— Your Service Team</p>
    `);

        res.json({
            success: true,
            update: populatedUpdate,
            approvalCreated: !!approval,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add update' });
    }
};

// 3. Client requests final completion confirmation (with payment info)
exports.requestConfirmCompletion = async (req, res) => {
    try {
        const { note, paymentMethod, transactionRef } = req.body;
        let paymentProofImage = req.file?.path || null;

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your request' });
        }

        if (request.status !== 'READY_FOR_COMPLETION') {
            return res.status(400).json({ message: 'Request is not ready for completion confirmation' });
        }

        const approval = await Approval.create({
            actionType: 'CONFIRM_COMPLETION',
            payload: {
                requestId: request._id,
                note,
                paymentMethod,
                transactionRef,
                paymentProofImage,
            },
            requestedBy: req.user._id,
            targetRequest: request._id,
        });

        // Notify admins
        notifySuperAdmins('approval:new', {
            approvalId: approval._id,
            action: 'CONFIRM_COMPLETION',
            requestId: request._id,
            client: req.user.username || req.user.email,
        });

        // Email client (confirmation of request sent)
        await sendClientEmail(req.user, 'Completion confirmation request received', `
      <p>Thank you, ${req.user.firstName || 'Customer'}!</p>
      <p>We received your confirmation that the job is complete and payment has been made.</p>
      <p>Our team will review and finalize the request shortly.</p>
      <p>Request ID: ${request._id}</p>
      <p>Thank you for choosing us!</p>
    `);

        res.status(201).json({
            message: 'Completion confirmation request sent for admin review',
            approvalId: approval._id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to submit completion confirmation' });
    }
};

// 4. (Optional) Get my service requests (client view)
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({
            user: req.user._id,
            organization: req.user.organization,
        })
            .populate('assignedTo', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load your requests' });
    }
};

module.exports = {
    requestAssignTechnician,
    addProgressUpdate,
    requestConfirmCompletion,
    getMyRequests,
};
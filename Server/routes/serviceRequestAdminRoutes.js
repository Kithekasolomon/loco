// routes/serviceRequestAdminRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const ServiceRequestUpdate = require('../models/ServiceRequestUpdate');
const { uploadSingle, uploadMultiple } = require('../middleware/upload'); 

// Allowed roles: adjust according to your role names
const PROVIDER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PROVIDER', 'TECHNICIAN'];


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


// 1. Client assigns technician (optional)
router.patch('/requests/:id/assign-self', auth, async (req, res) => {
    try {
        const { assignedTo } = req.body;

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
            organization: req.user.organization,
            status: { $in: ['PENDING', 'CONFIRMED'] }
        });

        if (!request) return res.status(404).json({ message: "Request not found or not assignable" });

        if (assignedTo) {
            const tech = await User.findOne({
                _id: assignedTo,
                organization: req.user.organization,
                isActive: true,
                // role: technicianRole._id   ← add if you want strict check
            });
            if (!tech) return res.status(400).json({ message: "Invalid technician" });
            request.assignedTo = assignedTo;
        }

        // Optional: if client assigns → auto confirm
        if (request.status === 'PENDING') {
            request.status = 'CONFIRMED';
        }

        request.updatedBy = req.user._id;
        await request.save();

        res.json({ message: "Assignment updated", request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 2. Client confirms job done + payment
router.patch('/requests/:id/confirm-completion', auth, uploadSingle, async (req, res) => {
    try {
        const { note, paymentMethod, transactionRef } = req.body;
        let paymentProof = null;

        if (req.file) {
            paymentProof = req.file.path; 
        }

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'READY_FOR_COMPLETION'
        });

        if (!request) {
            return res.status(400).json({ message: "Can only confirm READY_FOR_COMPLETION requests" });
        }

        request.status = 'COMPLETED';           
        request.clientConfirmedPayment = true;
        request.clientConfirmationNote = note?.trim() || undefined;
        request.completedByClient = req.user._id;
        request.clientConfirmedAt = new Date();
        request.updatedBy = req.user._id;

        if (paymentProof) request.paymentProofImage = paymentProof;
        if (paymentMethod) request.paymentMethod = paymentMethod;
        if (transactionRef) request.transactionRef = transactionRef;

        await request.save();

        res.json({ message: "Completion confirmed", request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Admin final approval (optional – close the loop)
router.patch('/admin/requests/:id/final-approve', auth, role(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    const request = await ServiceRequest.findOneAndUpdate(
        { _id: req.params.id, organization: req.user.organization },
        {
            adminFinalApproval: true,
            approvedByAdmin: req.user._id,
            approvedAt: new Date(),
            updatedBy: req.user._id,
        },
        { new: true }
    );

    if (!request) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Final approval granted", request });
});

module.exports = router;
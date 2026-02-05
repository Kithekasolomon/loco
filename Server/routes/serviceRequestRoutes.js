

const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
    requestAssignTechnician,
    addProgressUpdate,
    requestConfirmCompletion,
    getMyRequests,
} = require('../controllers/serviceRequestController');

const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceRequestUpdate = require('../models/ServiceRequestUpdate');
const User = require('../models/User');

const { uploadSingle, uploadMultiple } = require('../middleware/upload');

// Role groups – adjust names to match your Role collection exactly
const CLIENT_ROLES = ['CLIENT'];              
const PROVIDER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PROVIDER', 'TECHNICIAN'];
const ADMIN_ONLY_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// ────────────────────────────────────────────────
//               CLIENT-FACING ROUTES
// ────────────────────────────────────────────────

// List available services
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

// Get my own requests (client view)
router.get('/requests/my', auth, role([...CLIENT_ROLES, ...PROVIDER_ROLES]), getMyRequests);

// Create new service request
router.post('/requests', auth, role(CLIENT_ROLES), async (req, res) => {
    try {
        if (!req.user.organization) {
            return res.status(403).json({ message: "No organization assigned. Contact admin." });
        }

        const { serviceType, description, location, date, time, price, image } = req.body;

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
            status: 'PENDING',
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

// Get single request (client view – own request only)
router.get('/requests/:id', auth, role(CLIENT_ROLES), async (req, res) => {
    try {
        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
            organization: req.user.organization,
        });

        if (!request) return res.status(404).json({ message: 'Request not found or not yours' });

        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Client cancels own request
router.patch('/requests/:id/cancel', auth, role(CLIENT_ROLES), async (req, res) => {
    try {
        const { reason } = req.body;

        const request = await ServiceRequest.findOne({
            _id: req.params.id,
            user: req.user._id,
            organization: req.user.organization,
        });

        if (!request) return res.status(404).json({ message: 'Not found' });

        if (!['PENDING', 'CONFIRMED'].includes(request.status)) {
            return res.status(400).json({ message: 'Cannot cancel anymore' });
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

// Client requests technician assignment (approval flow)
router.patch('/requests/:id/assign-self', auth, role(CLIENT_ROLES), requestAssignTechnician);

// Client confirms completion + payment (approval flow)
router.patch('/requests/:id/confirm-completion', auth, role(CLIENT_ROLES), uploadSingle, requestConfirmCompletion);

// ────────────────────────────────────────────────
//           ADMIN / TECHNICIAN / PROVIDER ROUTES
// ────────────────────────────────────────────────

// List all requests (admin/provider dashboard)
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
        res.status(500).json({ message: 'Failed to load requests' });
    }
});

// Admin directly assigns technician (bypass approval – for super-admins)
router.patch('/admin/requests/:id/assign', auth, role(ADMIN_ONLY_ROLES), async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo) return res.status(400).json({ message: 'assignedTo required' });

        const technician = await User.findOne({
            _id: assignedTo,
            organization: req.user.organization,
            isActive: true,
        });

        if (!technician) return res.status(400).json({ message: 'Invalid technician' });

        const request = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, organization: req.user.organization },
            {
                assignedTo,
                updatedBy: req.user._id,
                status: { $in: ['PENDING'] } ? 'CONFIRMED' : undefined,
            },
            { new: true }
        ).populate('assignedTo', 'firstName lastName username');

        if (!request) return res.status(404).json({ message: 'Request not found' });

        res.json({ message: `Assigned to ${technician.firstName || technician.username}`, request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Technician adds progress update (can request ready-for-completion)
router.post('/admin/requests/:id/update', auth, role(PROVIDER_ROLES), uploadMultiple, addProgressUpdate);

// Update request status (with transition rules)
router.patch('/admin/requests/:id/status', auth, role(PROVIDER_ROLES), async (req, res) => {
    try {
        const { status, note } = req.body;

        const allowedTransitions = {
            PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED'],
            CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'REJECTED'],
            IN_PROGRESS: ['READY_FOR_COMPLETION', 'CANCELLED'],
            READY_FOR_COMPLETION: ['COMPLETED', 'CANCELLED'],
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
                message: `Invalid transition: ${request.status} → ${status}`,
            });
        }

        request.status = status;
        request.updatedBy = req.user._id;

        if (note?.trim()) {
            request.internalNote = (request.internalNote || '') +
                `\n${new Date().toISOString()} - ${status}: ${note}`;
        }

        await request.save();

        res.json({ message: `Status updated to ${status}`, request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update price
router.patch('/admin/requests/:id/price', auth, role(ADMIN_ONLY_ROLES), async (req, res) => {
    try {
        const { price } = req.body;
        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({ message: 'Valid non-negative price required' });
        }

        const request = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, organization: req.user.organization },
            { price, updatedBy: req.user._id },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: 'Not found' });

        res.json({ message: 'Price updated', request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// List updates for a request
router.get('/admin/requests/:id/updates', auth, role(PROVIDER_ROLES), async (req, res) => {
    try {
        const updates = await ServiceRequestUpdate.find({ request: req.params.id })
            .populate('user', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .lean();

        res.json(updates);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load updates' });
    }
});

// Admin final approval after client confirmation
router.patch('/admin/requests/:id/final-approve', auth, role(ADMIN_ONLY_ROLES), async (req, res) => {
    try {
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

        if (!request) return res.status(404).json({ message: 'Not found' });

        res.json({ message: 'Final approval granted', request });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
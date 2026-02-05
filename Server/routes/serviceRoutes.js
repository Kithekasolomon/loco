const router = require('express').Router();
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
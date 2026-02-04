const mongoose = require('mongoose');
const DailySiteReport = require('../models/DailySiteReport');
const Project = require('../models/Project');
const BoqItem = require('../models/BoqItem');
const Approval = require('../models/Approval');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const notification = require('../services/notification');

const ObjectId = mongoose.Types.ObjectId;


const { uploadSingle, uploadMultiple } = require('../middleware/upload');

// Upload site photo(s) or receipt(s)
// In dailySiteReportController.js - uploadPhotos

exports.uploadPhotos = async (req, res) => {
    try {
        const { reportId, type = 'sitePhotos', expenseId } = req.body;

        if (!['sitePhotos', 'receipts'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid upload type' });
        }

        const report = await DailySiteReport.findOne({
            _id: reportId,
            submittedBy: req.user.id,
            status: { $in: ['DRAFT', 'SUBMITTED'] },
        });

        if (!report) {
            return res.status(403).json({
                success: false,
                message: 'Report not found, not editable, or you do not have permission'
            });
        }

        let files = req.files || (req.file ? [req.file] : []);
        if (files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const uploaded = files.map(file => ({
            url: file.path,                    
            public_id: file.filename,
            uploadedAt: new Date(),
            uploadedBy: req.user.id
        }));

        if (type === 'sitePhotos') {
            report.sitePhotos.push(...uploaded);
        }
        else if (type === 'receipts') {
            if (!expenseId) {
                return res.status(400).json({
                    success: false,
                    message: 'expenseId is required when uploading receipts'
                });
            }

            const expense = report.dailyExpenses.id(expenseId); 

            if (!expense) {
                return res.status(404).json({
                    success: false,
                    message: `Expense with id ${expenseId} not found in this report`
                });
            }

            if (!expense.receiptUrls) {
                expense.receiptUrls = [];
            }
            expense.receiptUrls.push(...uploaded.map(u => u.url));
            expense.hasReceipt = true;
        }

        await report.save();

        res.json({
            success: true,
            message: `${uploaded.length} file(s) uploaded successfully`,
            uploadedUrls: uploaded.map(u => u.url),
            type,
            ...(type === 'receipts' && { expenseId })
        });

    } catch (error) {
        console.error('uploadPhotos error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
};

// ────────────────────────────────────────────────
// A. Create Draft
// ────────────────────────────────────────────────
exports.createDraft = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Access control
        const userId = req.user._id.toString();
        const isSuperAdmin = req.user.role?.name === "SUPER_ADMIN";
        const isLead = project.projectLead?.toString() === userId;
        const isTeamMember = project.team?.some(t => t.toString() === userId);

        if (!isSuperAdmin && !isLead && !isTeamMember) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to create reports for this project'
            });
        }

        // Optional: pre-fill from last approved report
        let prefill = {};
        if (!req.body.workDone || !req.body.pendingWork) {
            const lastReport = await DailySiteReport.findOne({
                project: projectId,
                status: "APPROVED"
            })
                .sort({ reportDate: -1 })
                .lean();

            if (lastReport) {
                prefill.pendingWork = lastReport.pendingWork || '';
                prefill.workDone = req.body.workDone || lastReport.pendingWork || '';
            }
        }

        const report = new DailySiteReport({
            project: projectId,
            reportDate: req.body.reportDate ? new Date(req.body.reportDate) : new Date(),
            submittedBy: req.user._id,
            status: 'DRAFT',
            workDone: req.body.workDone || prefill.workDone || '',
            pendingWork: req.body.pendingWork || prefill.pendingWork || '',
            challengesFaced: req.body.challengesFaced || '',
            weatherConditions: req.body.weatherConditions || '',
            personnel: req.body.personnel || [],
            boqProgressUpdates: req.body.boqProgressUpdates || [],
            dailyExpenses: req.body.dailyExpenses || [],
            sitePhotos: [],
            // You can add materialsUsed, equipment, safetyIncidents here later
        });

        await report.save();

        res.status(201).json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error('createDraft error:', error);
        res.status(500).json({ success: false, message: 'Failed to create draft', error: error.message });
    }
};

// ────────────────────────────────────────────────
// B. Update Draft (only allowed when status = DRAFT)
// ────────────────────────────────────────────────
exports.updateDraft = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await DailySiteReport.findOne({
            _id: reportId,
            submittedBy: req.user.id,
            status: 'DRAFT',
        });

        if (!report) {
            return res.status(404).json({ success: false, message: 'Draft not found or not editable' });
        }

        // Merge allowed fields
        const allowedUpdates = [
            'reportDate', 'workDone', 'pendingWork', 'challengesFaced', 'weatherConditions',
            'personnel', 'boqProgressUpdates', 'dailyExpenses',
        ];

        allowedUpdates.forEach(key => {
            if (req.body[key] !== undefined) {
                report[key] = req.body[key];
            }
        });

        await report.save();

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update draft', error: error.message });
    }
};

// ────────────────────────────────────────────────
// C. Submit for Approval
// ────────────────────────────────────────────────
exports.submitForApproval = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await DailySiteReport.findOne({
            _id: reportId,
            submittedBy: req.user.id,
            status: 'DRAFT',
        }).populate('project', 'name');

        if (!report) {
            return res.status(400).json({ success: false, message: 'Report not found or not in draft state' });
        }

        report.status = 'SUBMITTED';
        await report.save();

        // Create approval request
        const approval = await Approval.create({
            actionType: 'SUBMIT_DAILY_REPORT',
            payload: { reportId: report._id.toString() },
            requestedBy: req.user.id,
        });

        // Notify approvers
        notification.notifySuperAdmins('daily-report:submitted', {
            reportId: report._id,
            projectId: report.project._id,
            projectName: report.project.name,
            submittedById: req.user.id,
            date: report.reportDate.toISOString().split('T')[0],
        });

        res.json({
            success: true,
            message: 'Report submitted for approval',
            data: report,
            approvalId: approval._id,
        });
    } catch (error) {
        console.error('submitForApproval error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit report' });
    }
};

// ────────────────────────────────────────────────
// D. Review (Approve / Reject)
// ────────────────────────────────────────────────
exports.reviewReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminComment } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
        }

        const report = await DailySiteReport.findById(reportId)
            .populate('project', 'name')
            .populate('submittedBy', 'username email firstName lastName');

        if (!report || report.status !== 'SUBMITTED') {
            return res.status(400).json({ success: false, message: 'Report not found or not pending review' });
            
        }

        report.status = status;
        report.adminComment = adminComment?.trim() || '';
        report.approvedBy = req.user.id;
        report.approvedAt = new Date();

        if (status === 'APPROVED') {
            for (const upd of report.boqProgressUpdates || []) {
                if (!upd.boqItem) continue;

                const boqItem = await BoqItem.findById(upd.boqItem);
                if (boqItem) {
                    boqItem.progressPercentage = (boqItem.progressPercentage || 0) + (upd.progressIncrementToday || 0);
                    await boqItem.save();
                }
            }

            await AuditLog.create({
                action: 'DAILY_REPORT_APPROVED',
                performedBy: req.user.id,
                metadata: {
                    reportId: report._id,
                    projectId: report.project._id,
                    date: report.reportDate,
                },
            });

            notification.notifyUser(report.submittedBy._id, 'daily-report:approved', {
                reportId: report._id,
                projectName: report.project.name,
                date: report.reportDate.toISOString().split('T')[0],
                comment: adminComment,
            });
        } else {
            notification.notifyUser(report.submittedBy._id, 'daily-report:rejected', {
                reportId: report._id,
                comment: adminComment,
            });
        }

        await report.save();

        res.json({
            success: true,
            message: `Report ${status.toLowerCase()}`,
            data: report,
        });
    } catch (error) {
        console.error('reviewReport error:', error);
        res.status(500).json({ success: false, message: 'Failed to review report' });
    }
};

// ────────────────────────────────────────────────
// E. Get reports for a project (with filters)
// ────────────────────────────────────────────────
exports.getProjectReports = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: 'Invalid project ID' });
        }
        console.log(projectId);

        const projectExists = await Project.exists({ _id: projectId });
        if (!projectExists) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

        const query = { project: new ObjectId(projectId) };
        if (status) query.status = status;
        if (startDate || endDate) {
            query.reportDate = {};
            if (startDate) query.reportDate.$gte = new Date(startDate);
            if (endDate) query.reportDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reports = await DailySiteReport.find(query)
            .populate('submittedBy', 'username firstName lastName')
            .populate('approvedBy', 'username')
            .populate('boqProgressUpdates.boqItem', 'itemNumber description unit')
            .sort({ reportDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await DailySiteReport.countDocuments(query);

        res.json({
            success: true,
            data: reports,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('getProjectReports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports',
            error: error.message
        });
    }
};

// ────────────────────────────────────────────────
// F. Weekly Aggregate (on-the-fly)
// ────────────────────────────────────────────────
exports.getWeeklyAggregate = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { year, week } = req.query; // e.g. year=2025, week=42

        if (!year || !week) {
            return res.status(400).json({ success: false, message: 'year and week are required' });
        }

        const startOfWeek = new Date(year, 0, 1);
        const dayOfYear = (parseInt(week) - 1) * 7 + 1;
        startOfWeek.setDate(dayOfYear);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const reports = await DailySiteReport.find({
            project: new ObjectId(projectId),
            reportDate: { $gte: startOfWeek, $lte: endOfWeek },
            status: 'APPROVED',
        }).populate('boqProgressUpdates.boqItem', 'quantity total valuedAmount');

        // ── Aggregations ──────────────────────────────────────────────

        // 1. Total expenses this week
        const totalExpenses = reports.reduce((sum, r) => sum + (r.totalExpensesToday || 0), 0);

        // 2. Total progress increment this week per BOQ item
        const progressByBoq = {};
        reports.forEach(report => {
            report.boqProgressUpdates.forEach(upd => {
                if (!upd.boqItem) return;
                const id = upd.boqItem._id.toString();
                if (!progressByBoq[id]) {
                    progressByBoq[id] = {
                        item: upd.boqItem,
                        increment: 0,
                        quantityDone: 0,
                    };
                }
                progressByBoq[id].increment += upd.progressIncrementToday || 0;
                progressByBoq[id].quantityDone += upd.quantityDoneToday || 0;
            });
        });

        // 3. Overall project progress impact this week
        const totalIncrementThisWeek = Object.values(progressByBoq).reduce((s, v) => s + v.increment, 0);

        // 4. Personnel hours (if you stored hoursWorked)
        const totalHours = reports.reduce((sum, r) => {
            return sum + (r.personnel || []).reduce((s, p) => s + (p.hoursWorked || 0), 0);
        }, 0);

        res.json({
            success: true,
            week: { year: parseInt(year), week: parseInt(week) },
            dateRange: {
                start: startOfWeek.toISOString().split('T')[0],
                end: endOfWeek.toISOString().split('T')[0],
            },
            summary: {
                totalExpensesThisWeek: totalExpenses,
                totalHoursOnSite: totalHours.toFixed(2),
                progressIncrementThisWeek: totalIncrementThisWeek.toFixed(2),
                boqItemsUpdated: Object.keys(progressByBoq).length,
            },
            detailedProgress: Object.values(progressByBoq),
            reportCount: reports.length,
        });
    } catch (error) {
        console.error('getWeeklyAggregate error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
    }
};
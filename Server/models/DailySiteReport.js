const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dailySiteReportSchema = new Schema({
    materialsUsed: [{
        description: { type: String, required: true },
        quantity: { type: Number, min: 0 },
        unit: String,
        supplier: String,
        cost: { type: Number, min: 0 },
    }],
    project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true,
    },
    reportDate: {
        type: Date,
        required: true,
        index: true,
    },
    submittedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
        default: "DRAFT",
        index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    adminComment: { type: String, trim: true },

    // Core narrative
    workDone: { type: String, required: true },
    pendingWork: { type: String },
    challengesFaced: { type: String },
    weatherConditions: { type: String },    

    // People & time tracking
    personnel: [{
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        entryTime: Date,
        exitTime: Date,
        workPerformed: { type: String, trim: true },
        hoursWorked: Number,   
    }],

    // Progress updates – multiple BOQ items
    boqProgressUpdates: [{
        boqItem: { type: Schema.Types.ObjectId, ref: "BoqItem", required: true },
        breakdownItem: { type: Schema.Types.ObjectId, ref: "BoqBreakdownItem" }, 
        quantityDoneToday: { type: Number, min: 0 },
        progressIncrementToday: { type: Number, min: 0, max: 100 }, 
        comment: String,
    }],
    dailyExpenses: [{
        description: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        category: { type: String },
        receiptUrls: [{
            type: String,               
            uploadedAt: { type: Date, default: Date.now },
            uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }],
    }],
    totalExpensesToday: { type: Number, default: 0 },

    // Photos (general site + proof)
    sitePhotos: [{
        url: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
    }],

}, { timestamps: true });


dailySiteReportSchema.pre("save", function () {
    if (this.dailyExpenses?.length) {
        this.totalExpensesToday = this.dailyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    }

    this.personnel.forEach(p => {
        if (p.entryTime && p.exitTime) {
            p.hoursWorked = (new Date(p.exitTime) - new Date(p.entryTime)) / (1000 * 60 * 60);
        }
    });
});


dailySiteReportSchema.index({ project: 1, reportDate: -1 });
dailySiteReportSchema.index({ submittedBy: 1, status: 1 });
dailySiteReportSchema.index({ "boqProgressUpdates.boqItem": 1 });

module.exports = mongoose.model("DailySiteReport", dailySiteReportSchema);
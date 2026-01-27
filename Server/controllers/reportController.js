// controllers/reportController.js
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const mongoose = require("mongoose");

const getDateRange = (period = "this_month") => {
    const now = new Date();
    let startDate, endDate = now;

    switch (period) {
        case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case "this_week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            break;
        case "this_month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "this_year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        default:
            startDate = new Date(0); // All time
    }

    return { startDate, endDate };
};

exports.getProfitAndLoss = async (req, res) => {
    try {
        const { startDate: startStr, endDate: endStr, period } = req.query;

        const { startDate, endDate } = startStr
            ? { startDate: new Date(startStr), endDate: new Date(endStr) }
            : getDateRange(period);

        // Aggregate totals by account type
        const aggregates = await Transaction.aggregate([
            {
                $match: {
                    posted: true,
                    transactionDate: { $gte: startDate, $lte: endDate },
                },
            },
            { $unwind: "$entries" },
            {
                $lookup: {
                    from: "accounts",
                    localField: "entries.account",
                    foreignField: "_id",
                    as: "accountDetails",
                },
            },
            { $unwind: "$accountDetails" },
            {
                $group: {
                    _id: "$accountDetails.type",
                    totalDebit: { $sum: "$entries.debit" },
                    totalCredit: { $sum: "$entries.credit" },
                },
            },
        ]);

        // Build P&L structure
        let revenue = 0, cogs = 0, expenses = 0, otherIncome = 0, otherExpense = 0;

        aggregates.forEach((agg) => {
            const net = agg.totalCredit - agg.totalDebit;
            switch (agg._id) {
                case "REVENUE":
                    revenue += net;
                    break;
                case "EXPENSE":
                    if (agg.totalDebit > agg.totalCredit) {
                        // Normal expense accounts have more debits
                        expenses += agg.totalDebit - agg.totalCredit;
                    }
                    break;
            }
        });

        const grossProfit = revenue - cogs;
        const operatingProfit = grossProfit - expenses;
        const netProfit = operatingProfit + otherIncome - otherExpense;

        const pnl = {
            period: {
                from: startDate.toISOString().split("T")[0],
                to: endDate.toISOString().split("T")[0],
            },
            revenue,
            costOfGoodsSold: cogs,
            grossProfit,
            operatingExpenses: expenses,
            operatingProfit,
            otherIncome,
            otherExpense,
            netProfit,
            details: aggregates,
        };

        res.json(pnl);
    } catch (err) {
        console.error("P&L Report Error:", err);
        res.status(500).json({ message: "Failed to generate Profit & Loss report" });
    }
};

exports.getBalanceSheet = async (req, res) => {
    try {
        const { asOfDate = new Date() } = req.query;
        const date = new Date(asOfDate);

        // Get all posted transactions up to date
        const aggregates = await Transaction.aggregate([
            {
                $match: {
                    posted: true,
                    transactionDate: { $lte: date },
                },
            },
            { $unwind: "$entries" },
            {
                $lookup: {
                    from: "accounts",
                    localField: "entries.account",
                    foreignField: "_id",
                    as: "accountDetails",
                },
            },
            { $unwind: "$accountDetails" },
            {
                $group: {
                    _id: {
                        accountId: "$accountDetails._id",
                        accountName: "$accountDetails.name",
                        accountCode: "$accountDetails.accountCode",
                        type: "$accountDetails.type",
                    },
                    balance: {
                        $sum: { $subtract: ["$entries.debit", "$entries.credit"] },
                    },
                },
            },
            {
                $group: {
                    _id: "$_id.type",
                    accounts: {
                        $push: {
                            name: "$_id.accountName",
                            code: "$_id.accountCode",
                            balance: "$balance",
                        },
                    },
                    total: { $sum: "$balance" },
                },
            },
        ]);

        // Structure Balance Sheet
        let assets = 0, liabilities = 0, equity = 0;

        const sections = {
            ASSETS: { total: 0, accounts: [] },
            LIABILITIES: { total: 0, accounts: [] },
            EQUITY: { total: 0, accounts: [] },
        };

        aggregates.forEach((group) => {
            const type = group._id;
            if (sections[type]) {
                sections[type] = {
                    total: group.total,
                    accounts: group.accounts.map((acc) => ({
                        ...acc,
                        balance: Number(acc.balance.toFixed(2)),
                    })),
                };

                switch (type) {
                    case "ASSET":
                        assets += group.total;
                        break;
                    case "LIABILITY":
                        liabilities += group.total;
                        break;
                    case "EQUITY":
                        equity += group.total;
                        break;
                }
            }
        });

        const totalLiabilitiesAndEquity = liabilities + equity;

        const balanceSheet = {
            asOfDate: date.toISOString().split("T")[0],
            assets: {
                total: Number(assets.toFixed(2)),
                ...sections.ASSETS,
            },
            liabilities: {
                total: Number(liabilities.toFixed(2)),
                ...sections.LIABILITIES,
            },
            equity: {
                total: Number(equity.toFixed(2)),
                ...sections.EQUITY,
            },
            totalLiabilitiesAndEquity: Number(totalLiabilitiesAndEquity.toFixed(2)),
            isBalanced: Math.abs(assets - totalLiabilitiesAndEquity) < 0.01,
        };

        res.json(balanceSheet);
    } catch (err) {
        console.error("Balance Sheet Error:", err);
        res.status(500).json({ message: "Failed to generate Balance Sheet" });
    }
};

// Optional: A/R Aging Report (Bonus)
exports.getARAging = async (req, res) => {
    try {
        const Invoice = require("../models/Invoice");
        const invoices = await Invoice.find({
            status: { $nin: ["PAID", "CANCELLED", "DRAFT"] },
        }).populate("customer", "displayName");

        const aging = invoices.map((inv) => {
            const daysOverdue = Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
            const bucket =
                daysOverdue <= 0 ? "Current" :
                    daysOverdue <= 30 ? "1-30" :
                        daysOverdue <= 60 ? "31-60" :
                            daysOverdue <= 90 ? "61-90" : "Over 90";

            return {
                customer: inv.customer?.displayName || "Unknown",
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                total: inv.total,
                outstanding: inv.total, // Enhance later with payments applied
                daysOverdue,
                bucket,
            };
        });

        res.json(aging);
    } catch (err) {
        res.status(500).json({ message: "Failed to generate A/R Aging" });
    }
};
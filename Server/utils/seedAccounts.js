const Account = require("../models/Account");

const defaultAccounts = [
    // Assets
    { accountCode: "10000", name: "Cash", type: "ASSET", subType: "Cash" },
    { accountCode: "10100", name: "Bank Account", type: "ASSET", subType: "Bank" },
    { accountCode: "12000", name: "Accounts Receivable", type: "ASSET", subType: "Accounts Receivable" },
    // Liabilities
    { accountCode: "20000", name: "Accounts Payable", type: "LIABILITY", subType: "Accounts Payable" },
    // Equity
    { accountCode: "30000", name: "Owner's Equity", type: "EQUITY", subType: "Equity" },
    // Income
    { accountCode: "40000", name: "Sales Revenue", type: "REVENUE", subType: "Income" },
    // Expenses
    { accountCode: "50000", name: "Cost of Goods Sold", type: "EXPENSE", subType: "Cost of Goods Sold" },
    { accountCode: "60000", name: "Operating Expenses", type: "EXPENSE", subType: "Expense" },
];

const seedAccounts = async () => {
    const existing = await Account.countDocuments();
    if (existing === 0) {
        await Account.insertMany(defaultAccounts.map(acc => ({ ...acc, createdBy: null })));
        console.log("Default Chart of Accounts seeded");
    }
};

module.exports = seedAccounts;
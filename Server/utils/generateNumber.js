const Invoice = require("../models/Invoice");
const Bill = require("../models/Bill");
const Payment = require("../models/Payment");

const generateInvoiceNumber = async () => {
    const lastInvoice = await Invoice.findOne({})
        .sort({ createdAt: -1 })
        .select("invoiceNumber");

    let nextSeq = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/INV-(\d+)$/);
        if (match) nextSeq = parseInt(match[1]) + 1;
    }

    return `INV-${String(nextSeq).padStart(4, "0")}`;
};

const generateBillNumber = async () => {
    const lastBill = await Bill.findOne({})
        .sort({ createdAt: -1 })
        .select("billNumber");

    let nextSeq = 1;
    if (lastBill && lastBill.billNumber) {
        const match = lastBill.billNumber.match(/BILL-(\d+)$/);
        if (match) nextSeq = parseInt(match[1]) + 1;
    }

    return `BILL-${String(nextSeq).padStart(4, "0")}`;
};
const generatePaymentNumber = async (type) => {
    const prefix = type === "RECEIVED" ? "PMT-R" : "PMT-M";
    const lastPayment = await Payment.findOne({ type })
        .sort({ createdAt: -1 })
        .select("paymentNumber");

    let nextSeq = 1;
    if (lastPayment && lastPayment.paymentNumber) {
        const match = lastPayment.paymentNumber.match(new RegExp(`${prefix}-(\\d+)`));
        if (match) nextSeq = parseInt(match[1]) + 1;
    }

    return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
};

module.exports = { generateInvoiceNumber, generateBillNumber, generatePaymentNumber };
const Account = require("../models/Account");
const { requestApproval } = require("./approvalController");

const forwardToApproval = async (req, res, actionType, payload) => {
  req.body = { actionType, payload };
  return requestApproval(req, res);
};

exports.createAccount = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user.id,
    };
    return forwardToApproval(req, res, "CREATE_ACCOUNT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request account creation" });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const payload = {
      accountId: req.params.id,
      updates: req.body,
    };
    return forwardToApproval(req, res, "EDIT_ACCOUNT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request account update" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const payload = { accountId: req.params.id };
    return forwardToApproval(req, res, "DELETE_ACCOUNT", payload);
  } catch (err) {
    res.status(500).json({ message: "Failed to request account deletion" });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ isActive: true })
      .sort({ accountCode: 1 })
      .populate("parentAccount", "name accountCode");
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      "parentAccount",
      "name"
    );
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
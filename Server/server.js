const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 
dns.setServers(['8.8.8.8', '1.1.1.1']);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedSuperAdmin = require("./utils/seedSuperAdmin");
const http = require("http");
const { initSocket } = require("./socket/socket");

const app = express();

// 
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);



app.use(express.json());

connectDB().then(() => {
  seedSuperAdmin();
  require("./utils/seedAccounts")();
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/approvals", require("./routes/approvalRoutes"));
app.use("/api/permissions", require("./routes/permissionRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/boq", require("./routes/boqRoutes"));
app.use("/api/boq-categories", require("./routes/boqCategoryRoutes"));
app.use("/api/boq-breakdown", require("./routes/boqBreakdownRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/bills", require("./routes/billRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/daily-reports", require("./routes/dailyReportRoutes"));


const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready at http://localhost:${PORT}`);
});

 
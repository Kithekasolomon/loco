require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedSuperAdmin = require("./utils/seedSuperAdmin");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

connectDB().then(seedSuperAdmin);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

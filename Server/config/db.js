const dns = require('node:dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");
};

module.exports = connectDB;

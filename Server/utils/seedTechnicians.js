
const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']); 


const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

async function seedTechnicians() {
    await mongoose.connect(process.env.MONGO_URI);

    const org = await mongoose.connection.db.collection('organizations').findOne();
    if (!org) throw new Error("No organization found");

    const technicianRole = await Role.findOne({ name: 'TECHNICIAN' });
    if (!technicianRole) {
        console.log("Role TECHNICIAN not found → create it first");
        process.exit(1);
    }

    const technicians = [
        { firstName: "John", lastName: "Kamau", username: "j.kamau.tech", email: "john.tech@demo.com", phone: "0712345678" },
        { firstName: "Mary", lastName: "Wanjiku", username: "m.wanjiku.tech", email: "mary.tech@demo.com", phone: "0723456789" },
        { firstName: "Peter", lastName: "Ochieng", username: "p.ochieng.tech", email: "peter.tech@demo.com", phone: "0734567890" },
    ];

    for (const t of technicians) {
        const exists = await User.findOne({ username: t.username });
        if (exists) {
            console.log(`Technician ${t.username} already exists`);
            continue;
        }

        const hashed = await bcrypt.hash("tech1234", 10); 

        await User.create({
            ...t,
            password: hashed,
            role: technicianRole._id,
            organization: org._id,
            isActive: true,
            createdBy: null,
        });

        console.log(`Created technician: ${t.username}`);
    }

    mongoose.connection.close();
}

seedTechnicians().catch(console.error);
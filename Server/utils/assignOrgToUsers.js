const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']);


const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Organization = require('../models/Organization');

async function assignOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const org = await Organization.findOne();
        if (!org) {
            console.log('No organization found. Create one first.');
            process.exit(1);
        }

        console.log('Assigning organization ID:', org._id.toString());

        const result = await User.updateMany(
            { organization: { $exists: false } }, 
            { $set: { organization: org._id } }
        );

        console.log('Updated users:', result.modifiedCount);
    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        mongoose.connection.close();
    }
}

assignOrg();
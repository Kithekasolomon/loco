const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const Organization = require('../models/Organization');
require('dotenv').config();

async function seedOrganization() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existing = await Organization.findOne({ name: 'Demo Organization' });

        if (existing) {
            console.log('Demo organization already exists → ID:', existing._id);
            process.exit(0);
        }

        const org = await Organization.create({
            name: 'Demo Organization',
            currency: 'KES',
            fiscalYearStart: new Date('2025-01-01'),
            createdBy: null, 
        });

        console.log('Created demo organization:');
        console.log('ID:', org._id.toString());
        console.log('Name:', org.name);
        console.log('Currency:', org.currency);

    } catch (err) {
        console.error('Organization seeding failed:', err.message);
    } finally {
        mongoose.connection.close();
    }
}

seedOrganization();
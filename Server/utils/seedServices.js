const dns = require('node:dns').promises;

dns.setServers(['8.8.8.8', '1.1.1.1']); const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const dummyServices = [
    {
        name: 'Plumbing Repair',
        slug: 'plumbing-repair',
        description: 'Fix leaks, unclog drains, install fixtures',
        category: 'Plumbing',
        basePrice: 3500,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/plumbing.jpg',
    },
    {
        name: 'Electrical Installation',
        slug: 'electrical-installation',
        description: 'Wiring, socket installation, lighting',
        category: 'Electrical',
        basePrice: 4500,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/electrical.jpg',
    },
    {
        name: 'AC Repair & Service',
        slug: 'ac-repair',
        description: 'Cleaning, gas refill, compressor repair',
        category: 'Air Conditioning',
        basePrice: 6000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/ac-repair.jpg',
    },
    {
        name: 'House Cleaning',
        slug: 'house-cleaning',
        description: 'Deep cleaning, post-construction cleanup',
        category: 'Cleaning',
        basePrice: 8000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/cleaning.jpg',
    },
    {
        name: 'Painting Services',
        slug: 'painting',
        description: 'Interior & exterior painting',
        category: 'Painting',
        basePrice: 12000,
        image: 'https://res.cloudinary.com/demo/image/upload/v1690000000/painting.jpg',
    },
];

async function seedServices() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Get first organization (or hardcode one for dev)
        const firstOrg = await mongoose.connection.db.collection('organizations').findOne();
        if (!firstOrg) {
            console.log('No organization found. Create one first.');
            process.exit(1);
        }

        const orgId = firstOrg._id;

        for (const svc of dummyServices) {
            await Service.findOneAndUpdate(
                { slug: svc.slug, organization: orgId },
                { ...svc, organization: orgId, isActive: true },
                { upsert: true, new: true }
            );
            console.log(`Upserted: ${svc.name}`);
        }

        console.log('Dummy services seeded successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedServices();
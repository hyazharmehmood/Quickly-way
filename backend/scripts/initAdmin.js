const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quicklyway';
        console.log('Connecting to MongoDB at:', mongoUri.split('@').pop()); // Hide credentials if any

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@quicklyway.com';
        const adminPassword = 'adminPassword123';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await User.create({
            name: 'Quicklyway Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin'
        });

        console.log('-----------------------------------');
        console.log('Admin user created successfully!');
        console.log('Email: ' + adminEmail);
        console.log('Password: ' + adminPassword);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();

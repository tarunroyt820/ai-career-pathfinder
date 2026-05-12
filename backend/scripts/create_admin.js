const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function run() {
    const fullName = String(process.argv[2] || '').trim();
    const email = normalizeEmail(process.argv[3]);
    const password = String(process.argv[4] || '');

    if (!fullName || !email || !password) {
        console.error('Usage: node scripts/create_admin.js "Admin Name" admin@example.com StrongPassword123');
        process.exit(1);
    }

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is missing in backend/.env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email }).select('fullName email role');
    if (existing) {
        console.error('A user with this email already exists.');
        console.log(existing);
        await mongoose.disconnect();
        process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true
    });

    console.log('Admin account created successfully.');
    console.log({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role
    });
    console.log('Login with the normal app login page using the same email and password.');

    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error('create_admin failed:', error);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // no-op
    }
    process.exit(1);
});

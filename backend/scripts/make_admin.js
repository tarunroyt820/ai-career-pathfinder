const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function run() {
    const email = normalizeEmail(process.argv[2]);

    if (!email) {
        console.error('Usage: node scripts/make_admin.js user@example.com');
        process.exit(1);
    }

    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is missing in backend/.env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
        { email },
        { role: 'admin' },
        { new: true }
    ).select('fullName email role isEmailVerified');

    if (!user) {
        console.error(`User not found for email: ${email}`);
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('Admin access granted successfully.');
    console.log({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
    });

    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error('make_admin failed:', error);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // no-op
    }
    process.exit(1);
});

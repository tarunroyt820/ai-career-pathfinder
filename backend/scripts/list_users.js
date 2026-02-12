
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: 'backend/.env' });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('Users found:', users.map(u => ({ email: u.email, id: u._id })));
        mongoose.disconnect();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

listUsers();

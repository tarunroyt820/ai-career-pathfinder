const mongoose = require('mongoose');
// NOTE: dotenv is loaded in server.js before this file is ever called.
// Do NOT add require('dotenv').config() here — it would load from the wrong path.

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            // Log a clear error but do not crash the server.
            // Auth and AI routes will fail gracefully if DB is unavailable.
            console.error('❌ MONGO_URI is not defined. Please add it to backend/.env');
            console.error('   Get a free MongoDB cluster at: https://cloud.mongodb.com');
            return;
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log the error clearly but do NOT call process.exit().
        // The server will still start; individual DB operations will return 500 errors.
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        console.error('   Check your MONGO_URI in backend/.env');
    }
};

module.exports = connectDB;
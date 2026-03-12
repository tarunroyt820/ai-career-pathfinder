// IMPORTANT: Load .env from the backend directory using __dirname.
// This guarantees dotenv always finds backend/.env no matter where
// the process is started from (root npm run dev:all or inside backend/).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/db');

const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'groq (default)'}`);
        console.log(`🔑 Groq Key loaded: ${process.env.GROQ_API_KEY ? 'YES ✅' : 'NO ❌ — check backend/.env'}`);
        console.log(`🔑 Gemini Key loaded: ${process.env.GEMINI_API_KEY ? 'YES ✅' : 'NO ❌'}`);
        console.log(`🌐 CORS allows: ${process.env.FRONTEND_URL || 'http://localhost:5173 (default)'}`);
    });
};

startServer();
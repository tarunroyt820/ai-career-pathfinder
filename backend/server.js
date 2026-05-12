// IMPORTANT: Load .env from the backend directory using __dirname.
// This guarantees dotenv always finds backend/.env no matter where
// the process is started from (root npm run dev:all or inside backend/).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/db');
const { expireOldRequests } = require('./jobs/requestExpiryJob');
const { runReminderJob } = require('./jobs/reminderJob');
const { runQualityScoreJob } = require('./jobs/qualityScoreJob');
const { runCareerPlanReminderJob } = require('./jobs/careerPlanMilestoneReminderJob');
const { initializeQueue, closeQueue } = require('./queues/aiQueue');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runIfDatabaseConnected = (jobName, jobFn) => {
    if (!connectDB.isDatabaseConnected()) {
        console.warn(`[${jobName}] Skipping run because MongoDB is not connected yet.`);
        return;
    }

    jobFn().catch((error) => {
        console.error(`[${jobName}] Failed to run: ${error.message}`);
    });
};

const startServer = async () => {
    const PORT = process.env.PORT || 5000;

    // Start the server immediately so the API stays reachable even if
    // MongoDB Atlas is temporarily unavailable. The database layer will keep
    // retrying in the background and route middleware will return 503s until
    // the connection is restored.
    connectDB().catch((error) => {
        console.error(`[db] Initial MongoDB connection failed: ${error.message}`);
        console.error('[db] The API will continue starting and keep retrying in the background.');
    });

    // Initialize AI queue
    try {
        await initializeQueue();
    } catch (err) {
        console.warn(`[QUEUE] Failed to initialize AI queue: ${err.message}`);
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`[BUILD] AI stack: Groq / Hugging Face / NVIDIA / OpenRouter`);
        console.log(`AI Provider: ${process.env.AI_PROVIDER || 'groq (default)'}`);
        console.log(`Career Path Provider: ${process.env.CAREER_PATH_PROVIDER || process.env.AI_PROVIDER || 'groq'}`);
        console.log(`Groq key loaded: ${process.env.GROQ_API_KEY ? 'YES' : 'NO - check backend/.env'}`);
        console.log(`OpenRouter key loaded: ${process.env.OPENROUTER_API_KEY ? 'YES' : 'NO - check backend/.env'}`);
        console.log(`HF token loaded: ${(process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY_2 || process.env.HF_API_TOKEN || process.env.HF_TOKEN) ? 'YES' : 'NO - check backend/.env'}`);
        console.log(`CORS allows: ${process.env.FRONTEND_URL || 'http://localhost:5173 (default)'}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n[SERVER] Gracefully shutting down...');
        await closeQueue();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n[SERVER] Gracefully shutting down...');
        await closeQueue();
        process.exit(0);
    });

    setInterval(() => {
        runIfDatabaseConnected('request-expiry', expireOldRequests);
    }, 60 * 60 * 1000);

    // Run reminders every 15 minutes for reliable window capture.
    setInterval(() => {
        runIfDatabaseConnected('reminder-job', runReminderJob);
    }, 15 * 60 * 1000);

    // Run career plan milestone reminders every 30 minutes
    setInterval(() => {
        runIfDatabaseConnected('career-plan-reminder', runCareerPlanReminderJob);
    }, 30 * 60 * 1000);

    // Prime quality score metrics quickly, then refresh every hour.
    runIfDatabaseConnected('quality-score', runQualityScoreJob);

    setInterval(() => {
        runIfDatabaseConnected('quality-score', runQualityScoreJob);
    }, 60 * 60 * 1000);
};

startServer();

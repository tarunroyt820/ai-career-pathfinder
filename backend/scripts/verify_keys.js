// Run this script to test if your API keys are working.
// Usage: cd backend && node scripts/verify_keys.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const groqService = require('../services/ai/groq.service');
const geminiService = require('../services/ai/gemini.service');
const openaiService = require('../services/ai/openai.service');

const TEST_PROMPT = "Hello! In exactly 10 words, tell me one career tip for a software developer.";

async function testKeys() {
    console.log("\n========================================");
    console.log("   NEXTRO AI — KEY VERIFICATION TOOL   ");
    console.log("========================================\n");

    console.log("ENV CHECK:");
    console.log(`  GROQ_API_KEY    : ${process.env.GROQ_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
    console.log(`  GEMINI_API_KEY  : ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing'}`);
    console.log(`  OPENAI_API_KEY  : ${process.env.OPENAI_API_KEY ? '✅ Loaded' : '⚠️  Not set (optional)'}`);
    console.log(`  MONGO_URI       : ${process.env.MONGO_URI ? '✅ Loaded' : '❌ Missing'}`);
    console.log(`  JWT_SECRET      : ${process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing'}`);
    console.log(`  JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '✅ Loaded' : '❌ Missing'}`);
    console.log("");

    // Test Groq (primary provider)
    console.log("1. Testing GROQ (primary AI provider)...");
    try {
        const res = await groqService.generateResponse(TEST_PROMPT);
        console.log("   ✅ Groq works! Response:", res.trim().substring(0, 100));
    } catch (err) {
        console.error("   ❌ Groq FAILED:", err.message);
    }

    // Test Gemini (first fallback)
    console.log("\n2. Testing GEMINI (fallback AI provider)...");
    try {
        const res = await geminiService.generateResponse(TEST_PROMPT);
        console.log("   ✅ Gemini works! Response:", res.trim().substring(0, 100));
    } catch (err) {
        console.error("   ❌ Gemini FAILED:", err.message);
    }

    // Test OpenAI (second fallback — optional)
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('REPLACE_')) {
        console.log("\n3. Testing OPENAI (second fallback)...");
        try {
            const res = await openaiService.generateResponse(TEST_PROMPT);
            console.log("   ✅ OpenAI works! Response:", res.trim().substring(0, 100));
        } catch (err) {
            console.error("   ❌ OpenAI FAILED:", err.message);
        }
    } else {
        console.log("\n3. OPENAI — Skipped (no key set, this is optional)");
    }

    console.log("\n========================================");
    console.log("VERIFICATION COMPLETE");
    console.log("If all keys you set show ✅, run: npm run dev:all");
    console.log("========================================\n");
}

testKeys();

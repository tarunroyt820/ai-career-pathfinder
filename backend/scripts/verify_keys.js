require('dotenv').config();
const geminiService = require('./services/ai/gemini.service');
const openaiService = require('./services/ai/openai.service');

async function testKeys() {
    console.log("--- AI KEY VERIFICATION ---");

    // Test OpenAI
    console.log("\n1. Testing OpenAI...");
    try {
        const openaiRes = await openaiService.generateResponse("Hello, who are you? Answer in 5 words.");
        console.log("✅ OpenAI Response:", openaiRes);
    } catch (err) {
        console.error("❌ OpenAI Error:", err.message);
    }

    // Test Gemini
    console.log("\n2. Testing Gemini...");
    try {
        const geminiRes = await geminiService.generateResponse("Hello, who are you? Answer in 5 words.");
        console.log("✅ Gemini Response:", geminiRes);
    } catch (err) {
        console.error("❌ Gemini Error:", err.message);
    }

    console.log("\n--- VERIFICATION COMPLETE ---");
}

testKeys();

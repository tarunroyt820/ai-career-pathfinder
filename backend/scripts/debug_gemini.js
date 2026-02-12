require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // The SDK doesn't have a direct 'listModels' without going through the base client
        // but we can try a simple request to a very basic model
        console.log("Testing key validity with a simple request...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("Response:", (await result.response).text());
    } catch (err) {
        console.log("Error details:", err);
    }
}

listModels();

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function diagnose() {
    const key = "AIzaSyB-VVga7Fir6r28TZh4ShhhZhpzUaOg6m8"; // Using the key provided
    const genAI = new GoogleGenerativeAI(key);

    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

    for (const modelName of models) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Ready'");
            const response = await result.response;
            console.log(`✅ ${modelName} works! Response: ${response.text()}`);
            return; // Stop if one works
        } catch (err) {
            console.log(`❌ ${modelName} failed: ${err.message}`);
        }
    }
}

diagnose();

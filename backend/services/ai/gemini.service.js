const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateResponse = async (prompt) => {
    try {
        // Validate key before attempting API call
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.startsWith('REPLACE_')) {
            throw new Error("GEMINI_API_KEY is missing or not set in backend/.env. Get a free key at https://aistudio.google.com/app/apikey");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini AI Service Error:", error.message);
        throw new Error("Failed to generate response from Gemini AI");
    }
};

module.exports = { generateResponse };
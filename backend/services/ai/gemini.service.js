const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateResponse = async (prompt) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini AI Service Error:", error);
        throw new Error("Failed to generate response from Gemini AI");
    }
};

module.exports = { generateResponse };

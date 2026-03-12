const OpenAI = require("openai");

const generateResponse = async (prompt) => {
    try {
        const deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        });

        const response = await deepseek.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-reasoner",
            messages: [
                { role: "system", content: "You are a career guidance assistant for Nextro, an AI career path finder." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1000,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek Service Error:", error);
        throw new Error("Failed to generate response from DeepSeek");
    }
};

module.exports = { generateResponse };
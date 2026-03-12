const OpenAI = require("openai");

const generateResponse = async (prompt) => {
    try {
        // Validate key before attempting API call
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('REPLACE_')) {
            throw new Error("OPENAI_API_KEY is missing or not set in backend/.env");
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are Nextro AI, an expert career counselor helping users find their ideal career path in any professional field. Give specific, actionable, markdown-formatted advice."
                },
                { role: "user", content: prompt }
            ],
            max_tokens: 1500,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Service Error:", error.message);
        throw new Error("Failed to generate response from OpenAI");
    }
};

module.exports = { generateResponse };
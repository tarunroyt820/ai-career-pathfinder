const OpenAI = require("openai");

const generateResponse = async (prompt) => {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a career guidance assistant for Nextro, an AI career path finder." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1000,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Service Error:", error);
        throw new Error("Failed to generate response from OpenAI");
    }
};

module.exports = { generateResponse };

const Groq = require("groq-sdk");

const generateResponse = async (prompt) => {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a career guidance assistant for Nextro, an AI career path finder.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Groq AI Service Error:", error);
        throw new Error("Failed to generate response from Groq AI");
    }
};

module.exports = { generateResponse };

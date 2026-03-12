const Groq = require("groq-sdk");

const generateResponse = async (prompt) => {
    try {
        // Validate key before attempting API call to give a clear error message
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith('REPLACE_')) {
            throw new Error("GROQ_API_KEY is missing or not set in backend/.env. Get a free key at https://console.groq.com");
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are "Nextro AI", an expert career counselor and professional development coach for the Nextro Career Pathfinder platform.

Your purpose is to help users — students, freshers, and working professionals — find the best career path in ANY corporate or professional field including tech, finance, marketing, design, management, data science, healthcare, and more.

YOUR CAPABILITIES:
- Analyse a user's current skills, education, experience level, and career goals
- Suggest realistic, personalized career paths based on their profile
- Provide step-by-step roadmaps (e.g., "To become a Data Scientist in 12 months, here's your plan...")
- Recommend specific skills, certifications, courses, and projects to strengthen their profile
- Give job market insights: high-demand roles, salary ranges, growth trends
- Compare career options (e.g., "Frontend vs Backend vs Full-Stack Developer")
- Help with interview preparation, resume tips, and LinkedIn profile advice
- Break down complex technical or corporate career ladders into simple steps

YOUR RULES:
- Always be encouraging, realistic, and specific — never give vague advice
- Format all responses using Markdown: use **bold**, bullet points, and ## headers
- Tailor every response to the user's profile context provided in the message
- If a user's goal is unclear, ask 1 clear clarifying question before answering
- Keep responses focused and actionable — under 600 words unless a roadmap is requested`,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 1500,
            temperature: 0.7,
        });

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Groq AI Service Error:", error.message);
        throw new Error("Failed to generate response from Groq AI");
    }
};

module.exports = { generateResponse };
const User = require('../models/User');
const Message = require('../models/Message');
const aiService = require('../services/ai/ai.service');

/**
 * Handle user questions using AI and MongoDB profile context
 * @route POST /api/ai/ask
 * @access Private
 */
exports.askAI = async (req, res) => {
    try {
        const { question } = req.body;
        const userId = req.user.id;

        if (!question) {
            return res.status(400).json({ message: "Question is required" });
        }

        // 1. Save User Message to DB
        await Message.create({
            userId,
            role: 'user',
            content: question
        });

        // 2. Fetch User Profile for context
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 3. Construct the personalized prompt
        const prompt = `
            The following is the professional profile of a student/professional using Nextro Career Pathfinder.
            
            USER PROFILE CONTEXT:
            - Full Name: ${user.fullName}
            - Current Job Title: ${user.jobTitle || "Student/Aspiring Professional"}
            - Experience Level: ${user.experienceLevel || "Not Specified"}
            - Career Goal: ${user.careerGoal || "Not specified yet"}
            - Skills: ${user.skills && user.skills.length > 0 ? user.skills.join(", ") : "None listed yet"}
            - Education: ${user.education.degree || "N/A"} from ${user.education.college || "N/A"} (Graduation: ${user.education.graduationYear || "N/A"})
            
            INSTRUCTIONS:
            - Provide clear, personalized career guidance based strictly on the profile provided.
            - If the user has a specific career goal, suggest actionable steps to reach it.
            - Be encouraging and focus on skill growth.
            - Use Markdown for response formatting (bullet points, bold text).
            
            USER QUESTION:
            "${question}"
            
            AI RESPONSE:
        `;

        // 4. Get response from the configured AI provider
        const answer = await aiService.getAIResponse(prompt);

        // 5. Save AI Response to DB
        await Message.create({
            userId,
            role: 'assistant',
            content: answer
        });

        res.json({
            answer,
            success: true
        });
    } catch (error) {
        console.error("AI Controller Error:", error);
        res.status(500).json({
            message: "AI service temporarily unavailable",
            success: false
        });
    }
};

/**
 * Fetch chat history for the logged-in user
 * @route GET /api/ai/history
 * @access Private
 */
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await Message.find({ userId }).sort({ timestamp: 1 });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({
            message: "Failed to fetch chat history",
            success: false
        });
    }
};

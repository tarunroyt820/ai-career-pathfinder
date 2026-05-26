const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Too many AI requests. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.user && req.user.id ? String(req.user.id) : ipKeyGenerator(req)),
});

router.post("/ask", protect, aiRateLimiter, aiController.askAI);
router.post("/chat/stream", protect, aiRateLimiter, aiController.streamChat);
router.get("/history", protect, aiRateLimiter, aiController.getHistory);
router.delete("/history", protect, aiRateLimiter, aiController.deleteHistory);
router.post("/skill-gap", protect, aiRateLimiter, aiController.generateSkillGap);

// Generate a full structured career plan (returns saved plan)
router.post("/generate-career-plan", protect, aiRateLimiter, aiController.generateCareerPlan);

// Job status endpoint for async AI jobs
router.get("/jobs/:jobId", protect, aiRateLimiter, aiController.getJobStatus);

// TEST ROUTE — no auth needed
router.get("/test", async (req, res) => {
    try {
        const aiService = require("../services/ai/ai.service");
        const answer = await aiService.getAIResponse("Say hello and confirm you are working! Keep it short.");
        res.json({
            success: true,
            message: "AI is working! ✅",
            response: answer,
            provider: process.env.AI_PROVIDER || "groq",
        });
    } catch (error) {
        res.json({
            success: false,
            message: "AI failed ❌",
            error: error.message,
        });
    }
});

module.exports = router;

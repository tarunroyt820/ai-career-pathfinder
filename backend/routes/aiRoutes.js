const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/ask', protect, aiController.askAI);
router.get('/history', protect, aiController.getHistory);

// TEST ROUTE — no auth needed
router.get('/test', async (req, res) => {
	try {
		const aiService = require('../services/ai/ai.service');
		const answer = await aiService.getAIResponse(
			"Say hello and confirm you are working! Keep it short."
		);
		res.json({
			success: true,
			message: "AI is working! ✅",
			response: answer,
			provider: process.env.AI_PROVIDER || "gemini"
		});
	} catch (error) {
		res.json({
			success: false,
			message: "AI failed ❌",
			error: error.message
		});
	}
});

module.exports = router;

const express = require("express");
const { protect } = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const controller = require("../controllers/adminAnalyticsController");

const router = express.Router();

router.get("/access", protect, adminMiddleware, (_req, res) => {
    return res.json({ success: true, isAdmin: true });
});
router.get("/summary", protect, adminMiddleware, controller.getSummary);
router.get("/ai-logs", protect, adminMiddleware, controller.getAiLogs);
router.get("/failed-ai-requests", protect, adminMiddleware, controller.getFailedAiRequests);

module.exports = router;

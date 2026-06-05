const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");
const controller = require("../controllers/agreementMessageController");

const router = express.Router();
const messageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: "Too many message requests, please wait a moment and try again."
});

router.get("/inbox", protect, messageLimiter, controller.listInbox);
router.get("/:agreementId/messages", protect, messageLimiter, controller.getMessages);
router.post("/:agreementId/messages", protect, messageLimiter, controller.sendMessage);

module.exports = router;

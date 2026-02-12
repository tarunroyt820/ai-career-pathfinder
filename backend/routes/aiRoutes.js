const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/ask', protect, aiController.askAI);
router.get('/history', protect, aiController.getHistory);

module.exports = router;

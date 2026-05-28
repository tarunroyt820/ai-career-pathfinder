const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/resumeUpload');
const { uploadResume, analyzeResume } = require('../controllers/resumeController');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.post('/analyze', protect, analyzeResume);

module.exports = router;

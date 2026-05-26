const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, profileController.getProfile);
router.put('/', protect, profileController.updateProfile);
router.delete('/', protect, profileController.deleteAccount);
router.post('/photo', protect, upload.single('photo'), profileController.uploadProfilePhoto);
router.get('/:id', profileController.getPublicProfile);

module.exports = router;

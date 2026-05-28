const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/globalLearningRequestController');

const router = express.Router();

router.post('/', protect, controller.createGlobalLearningRequest);
router.get('/', protect, controller.listGlobalLearningRequests);
router.get('/mine', protect, controller.listMyGlobalLearningRequests);
router.patch('/:id/accept', protect, controller.acceptGlobalLearningRequest);
router.patch('/:id/cancel', protect, controller.cancelGlobalLearningRequest);

module.exports = router;

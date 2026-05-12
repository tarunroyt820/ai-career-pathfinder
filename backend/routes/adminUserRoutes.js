const express = require('express');
const { protect } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const controller = require('../controllers/adminUserController');

const router = express.Router();

router.get('/', protect, adminMiddleware, controller.listUsers);
router.patch('/:id/suspend', protect, adminMiddleware, controller.suspendUser);
router.patch('/:id/unsuspend', protect, adminMiddleware, controller.unsuspendUser);
router.delete('/:id', protect, adminMiddleware, controller.deleteUser);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const courseController = require('../controllers/courseController');
const categoryController = require('../controllers/courseCategoryController');

const router = express.Router();

router.get('/courses', protect, adminMiddleware, courseController.listAdminCourses);
router.get('/courses/:id', protect, adminMiddleware, courseController.getAdminCourseById);
router.post('/courses', protect, adminMiddleware, courseController.createCourse);
router.put('/courses/:id', protect, adminMiddleware, courseController.updateCourse);

router.post('/course-categories', protect, adminMiddleware, categoryController.createCategory);
router.put('/course-categories/:id', protect, adminMiddleware, categoryController.updateCategory);

module.exports = router;

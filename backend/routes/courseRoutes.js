const express = require('express');
const controller = require('../controllers/courseController');

const router = express.Router();

router.get('/', controller.listCourses);
router.get('/featured', controller.listFeaturedCourses);
router.get('/:slug', controller.getCourseBySlug);
router.post('/:id/view', controller.trackCourseView);
router.post('/:id/redirect', controller.trackCourseRedirect);

module.exports = router;

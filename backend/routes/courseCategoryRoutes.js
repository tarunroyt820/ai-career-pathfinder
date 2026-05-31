const express = require('express');
const controller = require('../controllers/courseCategoryController');

const router = express.Router();

router.get('/', controller.listCategories);

module.exports = router;

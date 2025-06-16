const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const searchController = require('../controllers/searchController');

router.get('/', authenticate, searchController.searchHandler);
router.get('/recommendation', authenticate, searchController.recommendationHandler);

module.exports = router;

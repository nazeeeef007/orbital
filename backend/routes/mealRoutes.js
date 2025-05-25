const express = require('express');
const router = express.Router();
const { getUserMeals } = require('../controllers/mealController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getUserMeals);

module.exports = router;

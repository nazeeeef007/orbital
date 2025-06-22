const express = require('express');
const router = express.Router();
const { getUserMeals, likeMeal, unlikeMeal, commentMeal, getMealComments, saveMeal, unsaveMeal } = require('../controllers/mealController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getUserMeals);
router.post('/like', authenticate, likeMeal);
router.post('/unlike', authenticate, unlikeMeal);
router.post('/comment', authenticate, commentMeal);
router.get('/comments/:meal_id', authenticate, getMealComments);
router.post('/save', authenticate, saveMeal);
router.post('/unsave', authenticate, unsaveMeal);

module.exports = router;

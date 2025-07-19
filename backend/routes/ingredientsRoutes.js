const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ingredientsController = require('../controllers/ingredientsController');
router.get('/', authenticate, ingredientsController.getAllIngredients);
router.get('/:id', authenticate, ingredientsController.getIngredientsById);
router.get('/search', authenticate, ingredientsController.searchIngredients);

module.exports = router;

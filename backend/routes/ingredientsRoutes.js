const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const ingredientsController = require('../controllers/ingredientsController');
// More specific routes should come first
router.get('/search', authenticate, ingredientsController.searchIngredients); // This must be before /:id
router.get('/:id', authenticate, ingredientsController.getIngredientsById);
router.get('/', authenticate, ingredientsController.getAllIngredients);
module.exports = router;

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware'); // we'll define this below

// Route: /api/upload/upload
router.post(
  '/upload',
  authenticate,
  upload.fields([
    { name: 'meal_image', maxCount: 1 },
    { name: 'recipe_image', maxCount: 1 }
  ]),
  uploadController.uploadMeal
);

// router.post(
//   '/uploadAi',
//   authenticate,
//   upload.fields([
//     { name: 'meal_image', maxCount: 1 },
//     { name: 'recipe_image', maxCount: 1 }
//   ]),
//   uploadController.uploadMealAi
// );

module.exports = router;

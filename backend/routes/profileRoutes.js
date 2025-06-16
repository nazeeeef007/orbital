// routes/profile.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware'); // multer for avatar upload
const profileController = require('../controllers/profileController');


router.put(
  '/profile',
  authenticate,
  upload.single('avatar'), // handle avatar upload, field name = avatar
  profileController.updateProfile
);

router.get('/me', authenticate, profileController.getProfile);

module.exports = router;

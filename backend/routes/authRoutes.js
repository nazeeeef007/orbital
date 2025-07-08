const express = require('express');
const { signup, login, logout, getUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/user', authenticate,getUser);
module.exports = router;


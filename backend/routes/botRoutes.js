const express = require('express');
const { getMacroChat } = require('../controllers/chatBotController');
const { getMacroImage } = require('../controllers/imageBotController');

const router = express.Router();

router.post('/chat', getMacroChat);
router.post('/image', getMacroImage);

module.exports = router;

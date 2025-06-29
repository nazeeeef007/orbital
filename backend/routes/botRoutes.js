const express = require('express');
const injectOpenAI = require("../middleware/openaiMiddleware");
const { getMacroChat } = require('../controllers/chatBotController');
const { getMacroImage } = require('../controllers/imageBotController');

const router = express.Router();

router.post('/chat', injectOpenAI, getMacroChat);
router.post('/image', injectOpenAI, getMacroImage);

module.exports = router;

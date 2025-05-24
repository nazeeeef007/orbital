const express = require('express');
const { getMacroChat } = require('../controllers/chatBotController');

const router = express.Router();

router.post('/chat', getMacroChat);

module.exports = router;

// router.get('/picture', mydick)
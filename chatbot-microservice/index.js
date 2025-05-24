require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { sendChat } = require('./controllers/sendChatController');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.openai = openai;
  next();
});

app.post('/text', sendChat); //Takes {context, prompt} returns {calores: int, fat: int ...}

app.listen(port, () => {
  console.log(`Chatbot microservice listening at http://localhost:${port}`);
});


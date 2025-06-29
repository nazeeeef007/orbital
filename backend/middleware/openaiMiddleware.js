// middleware/openaiMiddleware.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in Railway
});

function injectOpenAI(req, res, next) {
  req.openai = openai;
  next();
}

module.exports = injectOpenAI;

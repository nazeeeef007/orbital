// controllers/chatController.js (continued)
const { analyzeTextWithOpenAI } = require("../services/sendTextService");

async function getMacroChat(req, res) {
  try {
    const { prompt } = req.body;
    const openai = req.openai;

    console.log(`Received chatbot request: ${prompt}`);

    const context = `You are a nutrition expert in Singaporean food. 
Given a food item, estimate its 'calories' (kcal), 'carbohydrates', 'protein',
'fat', and 'sugar' (grams). Respond with valid JSON with integer values only.
If input is not a food item, return an error message.`;

    const result = await analyzeTextWithOpenAI({ context, prompt, openai });

    console.log("Parsed macros:", result);
    return res.status(201).json(result);
  } catch (err) {
    console.error("getMacroChat error:", err.message);
    return res.status(422).json({
      error: err.message || "Chatbot API error",
    });
  }
}

module.exports = { getMacroChat };
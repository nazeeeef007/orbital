// controllers/yourController.js (or wherever getMacroImage is)
const { analyzeImageWithOpenAI } = require("../services/sendImageService");

async function getMacroImage(req, res) {
  try {
    const { imageBase64, description } = req.body;

    const openai = req.openai; // You must inject this from middleware or setup

    const result = await analyzeImageWithOpenAI({ imageBase64, description, openai });

    if (result.macros) {
      console.log(`Calories: ${result.macros.calories}`);
      console.log(`Carbs: ${result.macros.carbs}`);
      console.log(`Protein: ${result.macros.protein}`);
      console.log(`Fat: ${result.macros.fat}`);
    }

    console.log(`Cuisine: ${result.cuisine}`);
    console.log(`Meal time: ${result.meal_time}`);

    return res.status(200).json(result);
  } catch (err) {
    console.error("getMacroImage error:", err.message);
    return res.status(422).json({ error: err.message });
  }
}

module.exports = { getMacroImage };

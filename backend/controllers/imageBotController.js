require('dotenv').config();
const supabase = require("../models/supabaseClient");

async function getMacroImage(req, res) {
  try {
    const { prompt } = req.body;
    console.log(`Received chatbot request ${prompt}`);

    const context = `You are a nutrition expert in Singaporean food. 
    Given a food image, estimate its 'calories' (kcal), 'carbohydrates', 'protein',
    'fat', and 'sugar' (grams). Respond with valid JSON with integer values only.
    If input is not a food item, return an error message.`;

    const response = await fetch(`http://${process.env.BASE_URL}:3699/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.error || "Chatbot API error" });
    }
    console.log(`Calores: ${data.calories}`);
    console.log(`Carbohydrates: ${data.carbohydrates}`);
    console.log(`Protein: ${data.protein}`);
    console.log(`Fat: ${data.fat}`);
    console.log(`Sugar: ${data.sugar}`);
    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getMacroImage };
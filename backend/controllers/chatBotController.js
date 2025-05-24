const supabase = require("../models/supabaseClient");

async function getMacroChat(req, res) {
  try {
    const { prompt } = req.body;
    console.log(`Received chatbot request ${prompt}`);

    const context = `You are a nutrition expert in Singaporean food. 
    Given a food item, estimate its 'calories' (kcal), 'carbohydrates', 'protein',
    'fat', and 'sugar' (grams). Respond with valid JSON with integer values only.
    If input is not a food item, return an error message.`;

    const response = await fetch(`http://localhost:3699/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context, prompt }),
    });

    const data = await response.json();

    console.log(`Calores: ${data.calories}`);
    console.log(`Carbohydrates: ${data.carbohydrates}`);
    console.log(`Protein: ${data.protein}`);
    console.log(`Fat: ${data.fat}`);
    console.log(`Sugar: ${data.sugar}`);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: data.error || "Chatbot API error" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getMacroChat };

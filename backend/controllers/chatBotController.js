const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Call external microservice with prompt + context, expects JSON response with macros
async function getMacroChat(req, res) {
  try {
    const { prompt } = req.body;
    console.log(`Received chatbot request: ${prompt}`);

    const context = `You are a nutrition expert in Singaporean food. 
Given a food item, estimate its 'calories' (kcal), 'carbohydrates', 'protein',
'fat', and 'sugar' (grams). Respond with valid JSON with integer values only.
If input is not a food item, return an error message.`;

    const response = await fetch(`http://${process.env.BASE_URL}:3699/text`, {
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

    // Validate response
    const expectedKeys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
    const missingKeys = expectedKeys.filter(k => !(k in data));
    if (missingKeys.length > 0) {
      return res.status(422).json({
        error: `Missing macro keys in response: ${missingKeys.join(", ")}`,
        data,
      });
    }

    const invalidKeys = expectedKeys.filter(k => !Number.isInteger(data[k]));
    if (invalidKeys.length > 0) {
      return res.status(422).json({
        error: `Invalid macro values (not integers) for keys: ${invalidKeys.join(", ")}`,
        data,
      });
    }

    console.log(`Calories: ${data.calories}`);
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

// Call OpenAI directly via openai client (expects context and prompt in body)
async function sendChat(req, res) {
  try {
    const { context, prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log(`Received request for: ${prompt}`);

    const messages = [
      { role: "system", content: context },
      { role: "user", content: prompt },
    ];

    const openai = req.openai;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
    });

    const answer = response.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(answer);

      const keys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
      const missingKeys = keys.filter(k => !(k in parsed));
      if (missingKeys.length > 0) {
        return res.status(422).json({
          error: `Missing macro keys in response: ${missingKeys.join(", ")}`,
          data: parsed,
        });
      }

      const invalidKeys = keys.filter(k => !Number.isInteger(parsed[k]));
      if (invalidKeys.length > 0) {
        return res.status(422).json({
          error: `Invalid macro values (not integers) for keys: ${invalidKeys.join(", ")}`,
          data: parsed,
        });
      }

      console.log(`Calories: ${parsed.calories}`);
      console.log(`Carbohydrates: ${parsed.carbohydrates}`);
      console.log(`Protein: ${parsed.protein}`);
      console.log(`Fat: ${parsed.fat}`);
      console.log(`Sugar: ${parsed.sugar}`);

      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(422).json({
        error: "Invalid input or not a food item, please try again",
        message: answer,
      });
    }
  } catch (error) {
    console.error("Microservice error:", error);
    return res.status(500).json({ error: "Microservice error" });
  }
}

module.exports = {
  getMacroChat,
  sendChat,
};

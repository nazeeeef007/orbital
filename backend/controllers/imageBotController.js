require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getMacroImage(req, res) {
  try {
    const { imageBase64, description } = req.body;

    if (!imageBase64 || !imageBase64.startsWith("data:image")) {
      return res.status(400).json({ error: "A valid base64 image is required." });
    }
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Description is required." });
    }

    console.log(`Received macro estimation request for description: ${description}`);

    const microserviceUrl = `http://${process.env.BASE_URL}:3699/image`;

    const response = await fetch(microserviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, description }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "Microservice error" });
    }

    // Example of logged info, adjust keys based on your actual microservice output:
    if (data.macros) {
      console.log(`Calories: ${data.macros.calories}`);
      console.log(`Carbohydrates: ${data.macros.carbs}`);
      console.log(`Protein: ${data.macros.protein}`);
      console.log(`Fat: ${data.macros.fat}`);
    }
    console.log(`Cuisine: ${data.cuisine}`);
    console.log(`Meal time: ${data.meal_time}`);

    // Return the full microservice response JSON
    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getMacroImage };

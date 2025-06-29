// services/sendImageService.js
const sharp = require("sharp");

async function analyzeImageWithOpenAI({ imageBase64, description, openai }) {
  if (!imageBase64 || !imageBase64.startsWith("data:image")) {
    throw new Error("A valid base64 image is required.");
  }
  if (!description || typeof description !== "string") {
    throw new Error("Description is required.");
  }

  // Resize and compress image
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const imgBuffer = Buffer.from(base64Data, "base64");

  const resizedBuffer = await sharp(imgBuffer)
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const resizedBase64 = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;

  // Infer meal time
  const hour = new Date().getHours();
  let mealTime = "Snack";
  if (hour >= 5 && hour < 11) mealTime = "Breakfast";
  else if (hour >= 11 && hour < 15) mealTime = "Lunch";
  else if (hour >= 17 && hour < 21) mealTime = "Dinner";

  const messages = [
    {
      role: "system",
      content: `You are a nutrition assistant. Given a food image and description, reply ONLY with JSON estimating macros based primarily on the portion size visible in the image. 
Use the description only if the image is unclear or unusable. Be sure the macros reflect the actual portion size in the image:
{
  "macros": { "calories": number, "protein": number, "carbs": number, "fat": number },
  "cuisine": string,
  "meal_time": string
}
No explanations or extra text.`,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `User says: "${description}". Based on this and the image, estimate macros, cuisine, and meal time (use server time hint: ${mealTime}). Prioritize the portion size seen in the image; use description only if the image is unusable.`,
        },
        { type: "image_url", image_url: { url: resizedBase64 } },
      ],
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.2,
  });

  const output = response.choices[0]?.message?.content?.trim();
  const cleaned = output.replace(/^```json\n?/, "").replace(/\n?```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON:", cleaned);
    throw new Error("Model did not return valid JSON.");
  }
}

module.exports = { analyzeImageWithOpenAI };

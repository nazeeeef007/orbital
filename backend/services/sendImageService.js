const sharp = require("sharp");

async function analyzeImageWithOpenAI({ imageBase64, description, openai }) {
  if (!description || typeof description !== "string") {
    throw new Error("Description is required.");
  }

  let resizedBase64 = null;
  if (imageBase64 && imageBase64.startsWith("data:image")) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    const resizedBuffer = await sharp(imgBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    resizedBase64 = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;
  }

  // Infer meal time
  const hour = new Date().getHours();

  // Construct messages
  const messages = [
    {
      role: "system",
      content: `You are a nutrition assistant. Given a food description${resizedBase64 ? " and image" : ""}, reply ONLY with JSON estimating macros based on visible or implied portion size. If there's no image, use the description only:
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
          text: `User says: "${description}". Estimate the macros, cuisine, and meal time (hint: ${hour}). ${
            resizedBase64
              ? "Prioritize the portion size seen in the image."
              : "Rely solely on the description since there is no image."
          }`,
        },
        ...(resizedBase64
          ? [{ type: "image_url", image_url: { url: resizedBase64 } }]
          : []),
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

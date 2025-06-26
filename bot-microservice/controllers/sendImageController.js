const sharp = require('sharp');

const sendImage = async (req, res) => {
  console.log('Received upload image & description')
  try {
    let { imageBase64, description } = req.body;

    if (!imageBase64 || !imageBase64.startsWith("data:image")) {
      return res.status(400).json({ error: "A valid base64 image is required." });
    }

    if (!description) {
      return res.status(400).json({ error: "Missing description in request body." });
    }

    // Resize image to max width 1024px to reduce token cost
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    const resizedBuffer = await sharp(imgBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .jpeg({ quality: 80 }) // optional: compress JPEG a bit
      .toBuffer();

    imageBase64 = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;


    const openai = req.openai;

    // Infer meal time based on server request time
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
          "cuisine": string, // one of: African, American, Asian, Caribbean, Chinese, French, German, Greek, Indian, Italian, Japanese, Korean, Mediterranean, Mexican, Middle Eastern, South American, Southeast Asian, Spanish, Thai, Turkish, Vietnamese, Other
          "meal_time": string // Breakfast, Lunch, Dinner, Snack
        }

        No explanations or extra text.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `User says: "${description}". Based on this and the image, estimate macros, cuisine, and meal time (use server time hint: ${mealTime}). Prioritize the portion size seen in the image; use description only if the image is unusable.`
          },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      }
    ];


    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2
    });
    const output = response.choices[0]?.message?.content?.trim();

    const cleaned = output.replace(/^```json\n?/, "").replace(/\n?```$/, "");

    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error("Failed to parse JSON:", cleaned);
      return res.status(422).json({ error: "Model did not return valid JSON." });
    }

  } catch (error) {
    console.error("Error in sendImage:", error);
    return res.status(500).json({ error: "Nutritional analysis failed." });
  }
};

module.exports = { sendImage };

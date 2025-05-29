//Use for image food

const sendImage = async (req, res) => {
  try {
    const { context, imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    console.log("Received image request");

    const messages = [
      {
        role: "system",
        content: context,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Estimate the nutritional values of the food shown in this image in JSON format with only keys: calories, carbohydrates, protein, fat, sugar. Values should be integers.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    const openai = req.openai;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 600,
    });

    const answer = response.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(answer);

      const keys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
      const valid =
        keys.every((key) => parsed[key] != undefined) &&
        keys.every((key) => Number.isInteger(parsed[key]));

      if (!valid) {
        console.log("Invalid image output");
        return res
          .status(422)
          .json({ error: "Invalid nutritional data format from image." });
      }

      console.log(`Image Nutritional Info:`, parsed);
      res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(422).json({
        error: "Image did not produce valid nutritional data",
        message: answer,
      });
    }
  } catch (error) {
    console.error("Image processing error:", error);
    res.status(500).json({ error: "Image microservice error" });
  }
};

export { sendImage };

//Use for image food

const sendImage = async (req, res) => {
  try {
    const { context, imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const messages = [
      { role: "system", content: context },
      { role: "user", content: base64Data },
    ];

    const openai = req.openai;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    const answer = response.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(answer);
      const keys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
      const valid =
        keys.every((key) => parsed[key] !== undefined) &&
        keys.every((key) => Number.isInteger(parsed[key]));

      if (!valid) {
        console.log("Invalid output");
        return res.status(422).json({ error: "Invalid nutritional data format." });
      }

      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(422).json({
        error: "Invalid input or not a food image, please try again",
        message: answer,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Microservice error" });
  }
};


export { sendImage };

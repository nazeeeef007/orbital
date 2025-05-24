//Use for text food

const sendChat = async (req, res) => {
  try {
    const { context, prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log(`Received request for ${prompt}`);

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

      // Check if all expected keys exist and are integers
      const keys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
      const valid =
        keys.every((key) => parsed[key] != undefined) &&
        keys.every((key) => Number.isInteger(parsed[key]));

      if (!valid) {
        console.log("Invalid output");
        return res
          .status(422)
          .json({ error: "Invalid nutritional data format." });
      }
      console.log(`Calores: ${parsed.calories}`);
      console.log(`Carbohydrates: ${parsed.carbohydrates}`);
      console.log(`Protein: ${parsed.protein}`);
      console.log(`Fat: ${parsed.fat}`);
      console.log(`Sugar: ${parsed.sugar}`);

      res.status(200).json(parsed);
    } catch (parseErr) {
      // If it’s not valid JSON, assume it's an error message from the AI
      return res.status(422).json({
        error: "Invalid input or not a food item, please try again",
        message: answer,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Microservice error" });
  }
};

export { sendChat };

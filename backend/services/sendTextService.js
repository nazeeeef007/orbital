// services/sendTextService.js

async function analyzeTextWithOpenAI({ context, prompt, openai }) {
  if (!prompt) throw new Error("Prompt is required");

  const messages = [
    { role: "system", content: context },
    { role: "user", content: prompt },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages,
  });

  const answer = response.choices[0].message.content.trim();

  const parsed = JSON.parse(answer);

  const keys = ["calories", "carbohydrates", "protein", "fat", "sugar"];
  const missing = keys.filter(k => !(k in parsed));
  const invalid = keys.filter(k => !Number.isInteger(parsed[k]));

  if (missing.length || invalid.length) {
    throw new Error("Invalid nutritional data format.");
  }

  return parsed;
}

module.exports = { analyzeTextWithOpenAI };

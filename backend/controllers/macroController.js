const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const getMacroHistory = async (req, res) => {
  const userId = req.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data, error } = await supabase
    .from("daily_macro_history")
    .select("date, calories, protein, carbs, fat")
    .eq("id", userId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching macro history:", error.message);
    return res.status(500).json({ error: "Failed to fetch macro history" });
  }

  // sanitize null values to 0
  const sanitizedData = data.map(entry => ({
    date: entry.date,
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
  }));

  return res.status(200).json({ data: sanitizedData });
};


module.exports = {
  getMacroHistory
};

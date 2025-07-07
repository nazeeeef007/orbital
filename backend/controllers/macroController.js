const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const getMacroHistory = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing' });
  }

  // Get date 6 days ago (to include 7 days including today)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_macro_history")
    .select("date, calories, protein, carbs, fat")
    .eq("id", userId)                      // ✅ Using `id` as user_id
    .gte("date", startDate)                // ✅ From 7 days ago onwards
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching macro history:", error.message);
    return res.status(500).json({ error: "Failed to fetch macro history" });
  }

  // Replace nulls with 0 to avoid frontend errors
  const sanitizedData = data.map(entry => ({
    date: entry.date,
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
  }));
  console.log("got macor history!");

  return res.status(200).json({ data: sanitizedData });
};

module.exports = {
  getMacroHistory,
};


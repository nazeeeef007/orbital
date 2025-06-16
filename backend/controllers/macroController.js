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


// | table_name          | column_name      | data_type                |
// | ------------------- | ---------------- | ------------------------ |
// | daily_macro_history | id               | uuid                     |
// | daily_macro_history | date             | date                     |
// | daily_macro_history | calories         | integer                  |
// | daily_macro_history | protein          | integer                  |
// | daily_macro_history | carbs            | integer                  |
// | daily_macro_history | fat              | integer                  |
// | meals               | id               | uuid                     |
// | meals               | user_id          | uuid                     |
// | meals               | meal_image_url   | text                     |
// | meals               | recipe_text      | text                     |
// | meals               | recipe_image_url | text                     |
// | meals               | calories         | numeric                  |
// | meals               | protein          | numeric                  |
// | meals               | carbs            | numeric                  |
// | meals               | fat              | numeric                  |
// | meals               | created_at       | timestamp with time zone |
// | meals               | cuisine          | character varying        |
// | meals               | meal_time        | character varying        |
// | meals               | course_type      | character varying        |
// | meals               | diet_type        | character varying        |
// | meals               | spice_level      | character varying        |
// | meals               | prep_time_mins   | integer                  |
// | meals               | serving_size     | character varying        |
// | profiles            | id               | uuid                     |
// | profiles            | username         | text                     |
// | profiles            | display_name     | text                     |
// | profiles            | bio              | text                     |
// | profiles            | avatar_url       | text                     |
// | profiles            | location         | text                     |
// | profiles            | website          | text                     |
// | profiles            | calories_goal    | integer                  |
// | profiles            | protein_goal     | integer                  |
// | profiles            | carbs_goal       | integer                  |
// | profiles            | fat_goal         | integer                  |
// | profiles            | created_at       | timestamp with time zone |
// | profiles            | updated_at       | timestamp with time zone |
// | profiles            | daily_calories   | integer                  |
// | profiles            | daily_protein    | integer                  |
// | profiles            | daily_carbs      | integer                  |
// | profiles            | daily_fat        | integer                  |
// | profiles            | daily_updated_at | date                     |
// | search_history      | id               | uuid                     |
// | search_history      | user_id          | uuid                     |
// | search_history      | query            | text                     |
// | search_history      | search_type      | character varying        |
// | search_history      | filters          | jsonb                    |
// | search_history      | created_at       | timestamp with time zone |
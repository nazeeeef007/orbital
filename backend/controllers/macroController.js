const { redisClient } = require('../utils/redis'); // 👈 Add this line
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Helper: calculate TTL until 12AM SGT (UTC+8)
function secondsUntilMidnightSGT() {
  const now = new Date();

  // Convert to UTC+8
  const utc8 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));

  // Set time to next 12AM SGT
  const nextMidnight = new Date(utc8);
  nextMidnight.setDate(utc8.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  const seconds = Math.floor((nextMidnight - utc8) / 1000);
  return seconds;
}

const getMacroHistory = async (req, res) => {
  const targetUserId = req.params.id;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Bad Request: User ID missing from URL' });
  }

  const isSelf = req.user && req.user.id === targetUserId;

  const cacheKey = `macro_history:${targetUserId}`;

  // ✅ Try cache if it's the user’s own data
  if (isSelf) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`💾 Returned cached macro history for user ${targetUserId}`);
        return res.status(200).json({ data: JSON.parse(cached) });
      }
    } catch (err) {
      console.error("❌ Redis GET failed:", err.message);
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_macro_history")
    .select("date, calories, protein, carbs, fat")
    .eq("id", targetUserId)
    .gte("date", startDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching macro history:", error.message);
    return res.status(500).json({ error: "Failed to fetch macro history" });
  }

  const sanitizedData = data.map(entry => ({
    date: entry.date,
    calories: entry.calories ?? 0,
    protein: entry.protein ?? 0,
    carbs: entry.carbs ?? 0,
    fat: entry.fat ?? 0,
  }));

  // ✅ Cache the data if it's their own request
  if (isSelf) {
    try {
      const ttl = secondsUntilMidnightSGT();
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(sanitizedData));
      console.log(`📦 Cached macro history for user ${targetUserId} with TTL ${ttl}s`);
    } catch (err) {
      console.error("❌ Redis SETEX failed:", err.message);
    }
  }

  console.log(`📤 Served macro history for user ID: ${targetUserId}`);
  return res.status(200).json({ data: sanitizedData });
};

module.exports = {
  getMacroHistory,
};

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const getUserMeals = async (req, res) => {
  const userId = req.user.id;
  console.log("getting User Meals!");
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

module.exports = { getUserMeals };
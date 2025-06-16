const supabase = require('../models/supabaseClient');

const getUserMeals = async (req, res) => {
  const userId = req.user.id;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  console.log("getting User Meals!");
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  console.log(`User ${userId} has ${data.length} meal(s).`);
  res.json(data);
};

module.exports = {
  getUserMeals
};

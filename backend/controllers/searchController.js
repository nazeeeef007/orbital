const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const searchHandler = async (req, res) => {
  const { q, type } = req.query;
  console.log('Search endpoint hit with query:', req.query);

  // Input validation
  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid query parameter "q"' });
  }

  if (!type || !['users', 'meals'].includes(type)) {
    return res.status(400).json({ error: 'Invalid or missing "type" parameter. Must be "users" or "meals"' });
  }

  const keyword = `%${q}%`;
  let result;

  try {
    if (type === 'users') {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.${keyword},display_name.ilike.${keyword}`)
        .limit(20);

      if (error) {
        console.error('Supabase error (users):', error.message);
        return res.status(status || 500).json({ error: 'Error querying user profiles' });
      }

      result = data;

    } else if (type === 'meals') {
      const { data, error, status } = await supabase
        .from('meals')
        .select('id, recipe_text, meal_image_url, calories, created_at, user_id')
        .ilike('recipe_text', keyword)
        .limit(20);

      if (error) {
        console.error('Supabase error (meals):', error.message);
        return res.status(status || 500).json({ error: 'Error querying meals' });
      }

      result = data;
    }

    return res.status(200).json({ results: result });

  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
  }
};

module.exports = {
  searchHandler
};

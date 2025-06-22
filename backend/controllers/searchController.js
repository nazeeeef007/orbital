const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const { v4: uuidv4 } = require('uuid');

const searchHandler = async (req, res) => {
  const { q, type} = req.query;
  const user_id = req.user?.id;
  console.log('Search endpoint hit with query:', req.query);

  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid query parameter "q"' });
  }

  if (!type || !['users', 'meals'].includes(type)) {
    return res.status(400).json({ error: 'Invalid or missing "type" parameter. Must be "users" or "meals"' });
  }

  const keyword = `%${q}%`;
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  let result;

  try {
    // 🧠 Save search history
    console.log(user_id);
    if (user_id && type === 'meals') {
      console.log("saving search histroy..");
      await supabase
        .from('search_history')
        .insert({
          id: uuidv4(),
          user_id,
          query: q,
          search_type: 'meals',
          filters: null,
          created_at: new Date().toISOString(),
        });
    }

    // 👥 Search users
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

      return res.status(200).json({ results: data });
    }

    // 🍱 Search meals
    const { data: meals, error, status } = await supabase
      .from('meals')
      .select('id, recipe_text, meal_image_url, calories, created_at, user_id, cuisine, meal_time, course_type, diet_type, spice_level, prep_time_mins, serving_size');

    if (error) {
      console.error('Supabase error (meals):', error.message);
      return res.status(status || 500).json({ error: 'Error querying meals' });
    }

    // 📊 Compute relevance score for each meal
    const scored = meals.map(meal => {
      const fields = [
        meal.recipe_text,
        meal.cuisine,
        meal.meal_time,
        meal.course_type,
        meal.diet_type,
        meal.spice_level,
        meal.serving_size,
      ].map(v => v?.toLowerCase() || '');

      let score = 0;
      for (const word of terms) {
        for (const field of fields) {
          if (field.includes(word)) score += 1;
        }
      }

      return { ...meal, score };
    });

    // 🔽 Sort by score
    scored.sort((a, b) => b.score - a.score);

    return res.status(200).json({ results: scored });

  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Unexpected server error. Please try again later.' });
  }
};

const recommendationHandler = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required or user ID missing' });
  }

  try {
    // 1️⃣ Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('calories_goal, protein_goal, carbs_goal, fat_goal, daily_calories, daily_protein, daily_carbs, daily_fat, daily_updated_at')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) console.warn('Profile fetch warning:', profileError?.message || 'Profile not found.');

    // 2️⃣ Recent meals
    const { data: userMeals = [] } = await supabase
      .from('meals')
      .select('cuisine, meal_time, course_type, diet_type, spice_level, calories, protein, carbs, fat, prep_time_mins, serving_size, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3️⃣ Search history
    const { data: searchHistory = [] } = await supabase
      .from('search_history')
      .select('query, search_type')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 4️⃣ Remaining macros
    const today = new Date().toISOString().split('T')[0];
    let remainingDailyMacros = null;
    if (profile && profile.daily_updated_at === today) {
      remainingDailyMacros = {
        calories: Math.max(0, (profile.calories_goal || 0) - (profile.daily_calories || 0)),
        protein: Math.max(0, (profile.protein_goal || 0) - (profile.daily_protein || 0)),
        carbs: Math.max(0, (profile.carbs_goal || 0) - (profile.daily_carbs || 0)),
        fat: Math.max(0, (profile.fat_goal || 0) - (profile.daily_fat || 0)),
      };
    }

    // 5️⃣ Preference frequency maps
    const prefs = {
      cuisine: {}, meal_time: {}, course_type: {}, diet_type: {}, spice_level: {}, serving_size: {},
      prep_time_mins_ranges: { short: 0, medium: 0, long: 0 }
    };

    for (const meal of userMeals) {
      ['cuisine', 'meal_time', 'course_type', 'diet_type', 'spice_level', 'serving_size'].forEach(field => {
        const val = meal[field];
        if (val) prefs[field][val] = (prefs[field][val] || 0) + 1;
      });
      if (meal.prep_time_mins != null) {
        if (meal.prep_time_mins <= 20) prefs.prep_time_mins_ranges.short++;
        else if (meal.prep_time_mins <= 45) prefs.prep_time_mins_ranges.medium++;
        else prefs.prep_time_mins_ranges.long++;
      }
    }

    // 6️⃣ Search keyword extraction
    const searchKeywords = new Set();
    for (const entry of searchHistory) {
      if (entry.query && entry.search_type === 'meals') {
        entry.query.toLowerCase().split(/\s+/).forEach(word => {
          if (word.length > 2) searchKeywords.add(word);
        });
      }
    }

    // 7️⃣ Get all meals
    const { data: allMealsRaw = [], error: allMealsError } = await supabase
      .from('meals')
      .select(`
        id, recipe_text, meal_image_url, calories, protein, carbs, fat, created_at,
        cuisine, meal_time, course_type, diet_type, spice_level, prep_time_mins, serving_size,
        meal_likes(count), meal_comments(count), meal_saves(count)
      `);

    if (allMealsError) {
      return res.status(500).json({ error: 'Failed to fetch meals' });
    }

    // 8️⃣ Liked/saved meals
    const { data: likedMeals = [] } = await supabase
      .from('meal_likes')
      .select('meal_id')
      .eq('user_id', user_id);

    const { data: savedMeals = [] } = await supabase
      .from('meal_saves')
      .select('meal_id')
      .eq('user_id', user_id);

    const likedMealIds = new Set(likedMeals.map(m => m.meal_id));
    const savedMealIds = new Set(savedMeals.map(m => m.meal_id));

    const scoredMeals = [];

    // 9️⃣ Scoring meals
    for (const meal of allMealsRaw) {
      let score = 0;

      const W = {
        NUTRITIONAL_FIT: 50, PREFERENCE_MATCH: 15, RECENT_MACRO_CLOSENESS: 20,
        SEARCH_KEYWORD_MATCH: 10, PREP_TIME_FIT: 5, SERVING_SIZE_FIT: 5,
        RECENCY: 2, LIKES: 5, COMMENTS: 3, SAVES: 7
      };

      ['calories', 'protein', 'carbs', 'fat'].forEach(field => {
        meal[field] = parseFloat(meal[field]) || 0;
      });

      const likesCount = meal.meal_likes?.[0]?.count || 0;
      const commentsCount = meal.meal_comments?.[0]?.count || 0;
      const savesCount = meal.meal_saves?.[0]?.count || 0;

      score += likesCount * W.LIKES + commentsCount * W.COMMENTS + savesCount * W.SAVES;

      // Nutritional fit
      if (profile) {
        for (const macro of ['calories', 'protein', 'carbs', 'fat']) {
          const goal = profile[`${macro}_goal`];
          const val = meal[macro];
          if (goal != null && val != null) {
            const diff = Math.abs(goal - val);
            score += Math.max(0, W.NUTRITIONAL_FIT * (1 - (diff / (goal || 1))));
          }
        }
      }

      // Remaining daily macro closeness
      if (remainingDailyMacros) {
        for (const macro of ['calories', 'protein', 'carbs', 'fat']) {
          const remaining = remainingDailyMacros[macro];
          const val = meal[macro];
          if (remaining != null && val != null) {
            const diff = Math.abs(remaining - val);
            score += Math.max(0, W.RECENT_MACRO_CLOSENESS * (1 - (diff / (remaining + val + 1))));
          }
        }
      }

      // Preference match
      ['cuisine', 'meal_time', 'course_type', 'diet_type', 'spice_level', 'serving_size'].forEach(field => {
        const val = meal[field];
        if (val && prefs[field][val]) {
          score += prefs[field][val] * W.PREFERENCE_MATCH;
        }
      });

      // Prep time
      if (meal.prep_time_mins != null) {
        const prepRange = meal.prep_time_mins <= 20 ? 'short' : meal.prep_time_mins <= 45 ? 'medium' : 'long';
        if (prefs.prep_time_mins_ranges[prepRange]) {
          score += prefs.prep_time_mins_ranges[prepRange] * W.PREP_TIME_FIT;
        }
      }

      // Search keywords
      const recipeLower = meal.recipe_text?.toLowerCase() || '';
      for (const kw of searchKeywords) {
        if (recipeLower.includes(kw)) {
          score += W.SEARCH_KEYWORD_MATCH;
        }
      }

      // Recency
      if (meal.created_at) {
        const daysAgo = (new Date() - new Date(meal.created_at)) / (1000 * 60 * 60 * 24);
        score += Math.max(0, W.RECENCY * (10 - Math.min(daysAgo, 10)));
      }

      // 🔒 Fetch comments with null-safe fallback
      let comments = [];
      try {
        const { data: fetchedComments, error: commentErr } = await supabase
          .from('meal_comments')
          .select('content, created_at, user_id, profiles(username)')
          .eq('meal_id', meal.id)
          .order('created_at', { ascending: false });

        if (commentErr) {
          console.warn(`Failed to fetch comments for meal ${meal.id}:`, commentErr.message);
        }

        if (Array.isArray(fetchedComments)) {
          comments = fetchedComments.map(c => ({
            content: c.content,
            created_at: c.created_at,
            user_id: c.user_id,
            username: c.profiles?.username || 'Unknown'
          }));
        }
      } catch (err) {
        console.warn(`Error while processing comments for meal ${meal.id}:`, err.message);
      }

      scoredMeals.push({
        ...meal,
        score: Math.max(0, score),
        likesCount,
        comments,
        savesCount,
        isLikedByCurrentUser: likedMealIds.has(meal.id),
        isSavedByCurrentUser: savedMealIds.has(meal.id)
      });
    }

    // 🔟 Return sorted recommendations
    const topMeals = scoredMeals
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return res.status(200).json({ recommendations: topMeals });

  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Unexpected server error while generating recommendations' });
  }
};


module.exports = {
  searchHandler,
  recommendationHandler
};

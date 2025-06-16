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
  console.log("User ID from auth:", user_id);

  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required or user ID missing' });
  }

  try {
    console.log("Reached recommendation for user:", user_id);

    // 1️⃣ Get user profile with all relevant goals
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('calories_goal, protein_goal, carbs_goal, fat_goal, daily_calories, daily_protein, daily_carbs, daily_fat, daily_updated_at')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.warn('Profile fetch warning:', profileError?.message || 'Profile not found.');
      // If profile is crucial for certain scores, you might want to adjust how
      // recommendations are generated or provide a default if it's missing.
    }

    // 2️⃣ Get recent meals eaten by this user (expanded fields)
    const { data: userMeals, error: userMealsError } = await supabase
      .from('meals')
      .select('cuisine, meal_time, course_type, diet_type, spice_level, calories, protein, carbs, fat, prep_time_mins, serving_size, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20); // Increased limit to capture more recent trends

    // 3️⃣ Get user's recent search history
    const { data: searchHistory, error: searchHistoryError } = await supabase
      .from('search_history')
      .select('query, search_type')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10); // Get recent search queries

    // 4️⃣ Get user's daily macro history for recent consumption
    const { data: dailyMacroHistory, error: dailyMacroHistoryError } = await supabase
      .from('daily_macro_history')
      .select('date, calories, protein, carbs, fat')
      .eq('user_id', user_id) // Assuming daily_macro_history also has user_id
      .order('date', { ascending: false })
      .limit(7); // Get last 7 days of macro history

    // Prepare preference maps for meal attributes
    const prefs = {
      cuisine: {},
      meal_time: {},
      course_type: {},
      diet_type: {},
      spice_level: {},
      prep_time_mins_ranges: { // Group prep times for preferences
        'short': 0, 'medium': 0, 'long': 0
      },
      serving_size: {}
    };

    // Build frequency maps for meal attributes from userMeals
    for (const meal of userMeals || []) {
      for (const field of ['cuisine', 'meal_time', 'course_type', 'diet_type', 'spice_level', 'serving_size']) {
        const val = meal[field];
        if (val) prefs[field][val] = (prefs[field][val] || 0) + 1;
      }
      // Process prep_time_mins into ranges
      if (meal.prep_time_mins != null) {
        if (meal.prep_time_mins <= 20) prefs.prep_time_mins_ranges.short++;
        else if (meal.prep_time_mins <= 45) prefs.prep_time_mins_ranges.medium++;
        else prefs.prep_time_mins_ranges.long++;
      }
    }

    // Extract keywords from search history
    const searchKeywords = new Set();
    for (const entry of searchHistory || []) {
      if (entry.query && entry.search_type === 'meals') {
        entry.query.toLowerCase().split(/\s+/).forEach(term => {
          if (term.length > 2) searchKeywords.add(term); // Only add meaningful terms
        });
      }
    }

    // Calculate current daily remaining macros (if profile has current day's data)
    let remainingDailyMacros = null;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (profile && profile.daily_updated_at === today) {
      remainingDailyMacros = {
        calories: Math.max(0, (profile.calories_goal || 0) - (profile.daily_calories || 0)),
        protein: Math.max(0, (profile.protein_goal || 0) - (profile.daily_protein || 0)),
        carbs: Math.max(0, (profile.carbs_goal || 0) - (profile.daily_carbs || 0)),
        fat: Math.max(0, (profile.fat_goal || 0) - (profile.daily_fat || 0)),
      };
      console.log("Remaining daily macros:", remainingDailyMacros);
    } else {
        console.log("Daily macros not updated for today or profile missing. Cannot use remaining macros for scoring.");
    }


    // 5️⃣ Get all meals from DB
    const { data: allMeals, error: allMealsError } = await supabase
      .from('meals')
      .select('id, recipe_text, meal_image_url, calories, protein, carbs, fat, created_at, cuisine, meal_time, course_type, diet_type, spice_level, prep_time_mins, serving_size');

    if (allMealsError) {
      console.error('Meal fetch error:', allMealsError.message);
      return res.status(500).json({ error: 'Failed to fetch meals' });
    }

    const scoredMeals = allMeals.map(meal => {
      let score = 0;

      // WEIGHTS (adjust these to fine-tune your algorithm)
      const WEIGHT_NUTRITIONAL_FIT = 50;
      const WEIGHT_PREFERENCE_MATCH = 15;
      const WEIGHT_RECENT_MEAL_MACRO_CLOSENESS = 20; // New weight
      const WEIGHT_SEARCH_KEYWORD_MATCH = 10;
      const WEIGHT_PREP_TIME_FIT = 5;
      const WEIGHT_SERVING_SIZE_FIT = 5;
      const WEIGHT_RECENCY = 2; // For newer meals

      // 💪 1. Nutritional closeness to goals (from profile goals)
      if (profile) {
        const macros = ['calories', 'protein', 'carbs', 'fat'];
        for (const macro of macros) {
          const goal = profile[`${macro}_goal`];
          const mealValue = meal[macro];
          if (goal != null && mealValue != null) {
            // Calculate a score based on how close the meal's macro is to the user's goal
            // Using a simple inverse relationship to difference for scoring
            const diff = Math.abs(goal - mealValue);
            // Smaller difference gets higher score. Scale to max WEIGHT_NUTRITIONAL_FIT.
            // Example: 0 diff = WEIGHT_NUTRITIONAL_FIT, large diff = 0
            score += Math.max(0, WEIGHT_NUTRITIONAL_FIT * (1 - (diff / goal))); // Avoid division by zero for goal
          }
        }
      }

      // 🎯 2. Nutritional closeness to *remaining* daily macros (if available for today)
      if (remainingDailyMacros) {
        const macros = ['calories', 'protein', 'carbs', 'fat'];
        for (const macro of macros) {
          const remaining = remainingDailyMacros[macro];
          const mealValue = meal[macro];
          if (remaining != null && mealValue != null) {
            // Reward meals that help meet remaining goals without overshooting too much
            const diff = Math.abs(remaining - mealValue);
            score += Math.max(0, WEIGHT_RECENT_MEAL_MACRO_CLOSENESS * (1 - (diff / (remaining + mealValue)))); // Normalize by sum to prevent huge differences from dominating
          }
        }
      }

      // 🍛 3. Preference similarity from past meals
      for (const field of ['cuisine', 'meal_time', 'course_type', 'diet_type', 'spice_level', 'serving_size']) {
        const val = meal[field];
        if (val && prefs[field][val]) {
          score += prefs[field][val] * WEIGHT_PREFERENCE_MATCH; // Weight by frequency in user's history
        }
      }

      // ⏱️ 4. Prep time preference
      if (meal.prep_time_mins != null) {
        let mealPrepRange = '';
        if (meal.prep_time_mins <= 20) mealPrepRange = 'short';
        else if (meal.prep_time_mins <= 45) mealPrepRange = 'medium';
        else mealPrepRange = 'long';

        if (prefs.prep_time_mins_ranges[mealPrepRange]) {
          score += prefs.prep_time_mins_ranges[mealPrepRange] * WEIGHT_PREP_TIME_FIT;
        }
      }

      // 🔍 5. Search keyword matching
      const recipeTextLower = meal.recipe_text?.toLowerCase() || '';
      for (const keyword of searchKeywords) {
        if (recipeTextLower.includes(keyword)) {
          score += WEIGHT_SEARCH_KEYWORD_MATCH;
        }
      }

      // 🆕 6. Recency of meal creation (bias towards newer meals uploaded by anyone)
      if (meal.created_at) {
        const mealDate = new Date(meal.created_at);
        const now = new Date();
        const daysAgo = (now.getTime() - mealDate.getTime()) / (1000 * 60 * 60 * 24);
        // Reward newer meals, penalize older ones, e.g., max score for < 7 days, then decays
        score += Math.max(0, WEIGHT_RECENCY * (10 - Math.min(daysAgo, 10))); // decays over 10 days
      }

      // Ensure score doesn't go negative, though with additions it's unlikely
      return { ...meal, score: Math.max(0, score) };
    });

    // Filter out meals with zero score (not relevant at all)
    const highlyScoredMeals = scoredMeals.filter(meal => meal.score > 0);

    // 🔽 Sort by score
    highlyScoredMeals.sort((a, b) => b.score - a.score);

    const topMeals = highlyScoredMeals.slice(0, 20);

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

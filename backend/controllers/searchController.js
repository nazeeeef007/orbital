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
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    //
    // ─── 1) FETCH USER PROFILE & DAILY MACRO GOALS ─────────────────────────────
    //
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        username, avatar_url,
        calories_goal, protein_goal, carbs_goal, fat_goal,
        daily_calories, daily_protein, daily_carbs, daily_fat,
        daily_updated_at
      `)
      .eq('id', user_id)
      .single();

    //
    // ─── 2) FETCH LAST 7 DAYS OF DAILY_MACRO_HISTORY ───────────────────────────
    //
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10);
    const { data: macroHistory = [] } = await supabase
      .from('daily_macro_history')
      .select('date, calories, protein, carbs, fat')
      .eq('id', user_id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false });

    // Compute consistency score: fraction of days where user hit ≥90% of each goal
    let consistency = 0;
    if (macroHistory.length) {
      const goodDays = macroHistory.filter(day =>
        day.calories   >= 0.9 * profile.calories_goal &&
        day.protein    >= 0.9 * profile.protein_goal &&
        day.carbs      >= 0.9 * profile.carbs_goal &&
        day.fat        >= 0.9 * profile.fat_goal
      ).length;
      consistency = goodDays / macroHistory.length;  // [0..1]
    }

    //
    // ─── 3) FETCH RECENT MEALS & BUILD PREFERENCE MAPS ─────────────────────────
    //
    const { data: userMeals, error: userMealsError } = await supabase
      .from('meals')
      .select('cuisine, meal_time, diet_type, spice_level, prep_time_mins, location')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (userMealsError) {
      console.warn('Failed to fetch user meals:', userMealsError.message);
    }
    const safeUserMeals = Array.isArray(userMeals) ? userMeals : [];

    const prefs = {
      cuisine: {}, meal_time: {}, diet_type: {}, spice_level: {}, location: {},
      prep_ranges: { short:0, medium:0, long:0 }
    };
    for (let m of safeUserMeals) {
      prefs.cuisine[m.cuisine]      = (prefs.cuisine[m.cuisine]||0)+1;
      prefs.meal_time[m.meal_time]  = (prefs.meal_time[m.meal_time]||0)+1;
      prefs.diet_type[m.diet_type]  = (prefs.diet_type[m.diet_type]||0)+1;
      prefs.spice_level[m.spice_level] = (prefs.spice_level[m.spice_level]||0)+1;
      prefs.location[m.location]    = (prefs.location[m.location]||0)+1;
      if (m.prep_time_mins != null) {
        if (m.prep_time_mins <=20) prefs.prep_ranges.short++;
        else if (m.prep_time_mins<=45) prefs.prep_ranges.medium++;
        else prefs.prep_ranges.long++;
      }
    }

    //
    // ─── 4) FETCH RECENT SEARCH FILTERS ─────────────────────────────────────────
    //
    const { data: searches = [] } = await supabase
      .from('search_history')
      .select('filters, search_type')
      .eq('user_id',user_id)
      .order('created_at',{ ascending:false })
      .limit(10);
    // Merge frequency of filter keys
    const filterFreq = {};
    for (let s of searches) {
      if (s.search_type==='meals' && s.filters) {
        for (let key of Object.keys(s.filters)) {
          filterFreq[key] = (filterFreq[key]||0)+1;
        }
      }
    }

    //
    // ─── 5) BUILD SOCIAL GRAPH BOOST ───────────────────────────────────────────
    //
    // We'll give a small bonus if the meal's author is followed by current user
    const { data: followingList = [] } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', user_id);
    const followingSet = new Set(followingList.map(f=>f.following_id));

    //
    // ─── 6) FETCH ALL MEALS + ENGAGEMENT + AUTHOR PROFILE ──────────────────────
    //
    const { data: allMeals, error: allMealsError } = await supabase
      .from('meals')
      .select(`
        id, user_id, recipe_text, meal_image_url,
        calories, protein, carbs, fat, created_at,
        cuisine, meal_time, diet_type, spice_level,
        prep_time_mins, location, price,
        meal_likes(count), meal_comments(count), meal_saves(count),
        profiles(username, avatar_url)
      `);

    if (allMealsError) {
      console.warn('Failed to fetch all meals:', allMealsError.message);
    }
    const safeAllMeals = Array.isArray(allMeals) ? allMeals : [];

    //
    // ─── 7) SCORING ──────────────────────────────────────────────────────────────
    //
    const W = {
      ENGAGE:   2,    // per like/comment/save
      NUTFIT:  30,
      CONSIST: 10,
      PREF:    15,
      FILTER:   5,
      RECENCY:  5,
      SOCIAL:   8,
      PREP:     5,
      PRICE:    5
    };

    const today = new Date().toISOString().split('T')[0];
    const remaining = (profile.daily_updated_at===today)
      ? {
         cal: Math.max(0,profile.calories_goal - profile.daily_calories),
         pro: Math.max(0,profile.protein_goal  - profile.daily_protein),
         carb:Math.max(0,profile.carbs_goal    - profile.daily_carbs ),
         fat: Math.max(0,profile.fat_goal      - profile.daily_fat   ),
        }
      : null;

    const scored = [];
    for (let meal of safeAllMeals) {
      let score = 0;
      // Engagement
      const L = meal.meal_likes?.[0]?.count||0;
      const C = meal.meal_comments?.[0]?.count||0;
      const S = meal.meal_saves?.[0]?.count||0;
      score += (L+C+S)*W.ENGAGE;

      // Nutritional fit to goal
      for (let mkey of ['calories','protein','carbs','fat']) {
        const goal=profile[`${mkey}_goal`], val=+meal[mkey];
        if (goal) {
          const diff=Math.abs(goal-val)/goal;
          score += W.NUTFIT*(1-Math.min(diff,1));
        }
      }
      // Consistency bonus
      score += consistency * W.CONSIST;

      // Remaining daily fit
      if (remaining) {
        for (let [mk,r] of Object.entries(remaining)) {
          const val = +meal[ mk==='cal'?'calories': mk==='pro'?'protein': mk==='carb'?'carbs':'fat' ];
          const diff=Math.abs(r-val)/(r+val+1);
          score += W.RECENCY*(1-Math.min(diff,1));
        }
      }

      // Preference match
      [['cuisine','cuisine'],['meal_time','meal_time'],['diet_type','diet_type'],['spice_level','spice_level'],['location','location']].forEach(([k,f])=>{
        if (prefs[k][meal[f]]) score += prefs[k][meal[f]] * W.PREF;
      });

      // Search filters
      for (let f of Object.keys(filterFreq)) {
        if (String(meal[f])===String(searches.find(s=>s.filters && s.filters[f])?.filters[f])) {
          score += filterFreq[f] * W.FILTER;
        }
      }

      // Prep time
      if (meal.prep_time_mins != null) {
        const range = meal.prep_time_mins<=20?'short': meal.prep_time_mins<=45?'medium':'long';
        if (prefs.prep_ranges[range]) score += prefs.prep_ranges[range]*W.PREP;
      }

      // Price sensitivity (if user has budget history in daily_macro_history? simple: cheaper = bonus)
      if (meal.price != null && profile.calories_goal) {
        const pct = meal.price / (profile.calories_goal/100);
        score += W.PRICE*(1-Math.min(pct,1));
      }

      // Social follow boost
      if (followingSet.has(meal.user_id)) score += W.SOCIAL;

      // Recency of meal creation
      const days = (Date.now() - new Date(meal.created_at))/86400000;
      score += W.RECENCY*Math.max(0,(10-days)/10);

      // Pull in author profile
      const author = meal.profiles || { username:'Unknown', avatar_url:null };

      scored.push({ 
        ...meal,
        author,
        score: Math.max(0,score.toFixed(2)),
        isLiked: !!L, isSaved:!!S
      });
    }

    //
    // ─── 8) SORT & RETURN ───────────────────────────────────────────────────────
    //
    const top = scored
      .sort((a,b)=>b.score - a.score)
      .slice(0,20);
    // console.log(top);
    return res.json({ recommendations: top });

  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error:'Server error generating recommendations' });
  }
};

module.exports = {
  searchHandler,
  recommendationHandler
};

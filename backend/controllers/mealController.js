const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// in the future might need to update this to make it moptimised
const getUserMeals = async (req, res) => {
    const userId = req.user.id; // User ID from authenticated token

    console.log("Getting User Meals!");
    const { data: meals, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (mealError) {
        return res.status(500).json({ error: mealError.message });
    }

    const enrichedMeals = await Promise.all(meals.map(async (meal) => {
        const mealId = meal.id;

        const [{ count: likesCount }, { count: savesCount }, { data: comments }] = await Promise.all([
            supabase
                .from('meal_likes')
                .select('id', { count: 'exact', head: true })
                .eq('meal_id', mealId),

            supabase
                .from('meal_saves')
                .select('id', { count: 'exact', head: true })
                .eq('meal_id', mealId),

            supabase
                .from('meal_comments')
                .select('content, created_at, user_id') // Added user_id to comments
                .eq('meal_id', mealId)
                .order('created_at', { ascending: false }),
        ]);

        // Determine if the current user (req.user.id) has liked or saved this meal
        // This part needs to be specifically added if this controller function is also used for recommendations.
        // For getUserMeals (which only returns *user's own* uploaded meals), this specific check might be less critical,
        // but for a general recommendation feed, it's essential.
        // If this function is only for 'my meals', then isLiked/isSavedByCurrentUser will always be true
        // if user_id is passed and it means the logged-in user liked/saved their own meal.
        // For a public/recommended feed, you'd fetch all likes/saves for that meal and check against req.user.id
        const { data: userLike, error: likeError } = await supabase
            .from('meal_likes')
            .select('id')
            .eq('meal_id', mealId)
            .eq('user_id', userId)
            .single();
        
        const { data: userSave, error: saveError } = await supabase
            .from('meal_saves')
            .select('id')
            .eq('meal_id', mealId)
            .eq('user_id', userId)
            .single();


        return {
            ...meal,
            likesCount,
            savesCount,
            comments,
            isLikedByCurrentUser: !!userLike, // True if userLike is not null
            isSavedByCurrentUser: !!userSave, // True if userSave is not null
        };
    }));

    console.log(`User ${userId} has ${enrichedMeals.length} enriched meal(s).`);
    res.json(enrichedMeals);
};

const getMealById = async (req, res) => {
  const mealId = req.params.id;
  const userId = req.user?.id; // From authentication middleware

  if (!mealId) {
    return res.status(400).json({ error: 'Meal ID is required' });
  }

  // 1. Fetch the meal
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('*')
    .eq('id', mealId)
    .single();

  if (mealError || !meal) {
    return res.status(404).json({ error: mealError?.message || 'Meal not found' });
  }

  // 2. Fetch metadata in parallel
  const [{ count: likesCount }, { count: savesCount }, { data: comments }, { data: userLike }, { data: userSave }] = await Promise.all([
    supabase
      .from('meal_likes')
      .select('id', { count: 'exact', head: true })
      .eq('meal_id', mealId),

    supabase
      .from('meal_saves')
      .select('id', { count: 'exact', head: true })
      .eq('meal_id', mealId),

    supabase
      .from('meal_comments')
      .select('content, created_at, user_id')
      .eq('meal_id', mealId)
      .order('created_at', { ascending: false }),

    supabase
      .from('meal_likes')
      .select('id')
      .eq('meal_id', mealId)
      .eq('user_id', userId)
      .maybeSingle(),

    supabase
      .from('meal_saves')
      .select('id')
      .eq('meal_id', mealId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const enrichedMeal = {
    ...meal,
    likesCount: likesCount || 0,
    savesCount: savesCount || 0,
    comments: comments || [],
    commentsCount: comments?.length || 0,
    isLikedByCurrentUser: !!userLike,
    isSavedByCurrentUser: !!userSave,
  };

  res.json(enrichedMeal);
};

// Like a meal
const likeMeal = async (req, res) => {
    // Get user_id from the authenticated token via middleware
    console.log("reached like meal");
    const user_id = req.user.id;
    const { meal_id } = req.body; // meal_id still comes from the request body

    const { error } = await supabase.from('meal_likes').insert({ user_id, meal_id });

    if (error) {
        // Handle unique constraint violation for existing like gracefully
        if (error.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: 'Meal already liked by this user.' });
        }
        return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
};

// Unlike a meal
const unlikeMeal = async (req, res) => {
    // Get user_id from the authenticated token via middleware
    const user_id = req.user.id;
    const { meal_id } = req.body;

    const { error } = await supabase
        .from('meal_likes')
        .delete()
        .eq('user_id', user_id)
        .eq('meal_id', meal_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
};

// Comment on a meal
const commentMeal = async (req, res) => {
    // Get user_id from the authenticated token via middleware
    const user_id = req.user.id;
    const { meal_id, content } = req.body;

    const { error } = await supabase
        .from('meal_comments')
        .insert({ user_id, meal_id, content });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
};

const getMealComments = async (req, res) => {
  const { meal_id } = req.params;

  const { data, error } = await supabase
    .from('meal_comments')
    .select(`
      content,
      created_at,
      user_id,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('meal_id', meal_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching meal comments:', error.message);
    return res.status(500).json({ error: error.message });
  }

  // Map the data to flatten the joined profile info
  const commentsWithUserInfo = data.map(comment => ({
    content: comment.content,
    created_at: comment.created_at,
    user_id: comment.user_id,
    username: comment.profiles?.username || 'Unknown User',
    avatar_url: comment.profiles?.avatar_url || null,
  }));

  res.json(commentsWithUserInfo);
};

// Save a meal
const saveMeal = async (req, res) => {
    // Get user_id from the authenticated token via middleware
    const user_id = req.user.id;
    const { meal_id } = req.body;

    const { error } = await supabase
        .from('meal_saves')
        .insert({ user_id, meal_id });

    if (error) {
        // Handle unique constraint violation for existing save gracefully
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Meal already saved by this user.' });
        }
        return res.status(500).json({ error: error.message });
    }
    res.json({ success: true });
};

// Unsave a meal
const unsaveMeal = async (req, res) => {
    // Get user_id from the authenticated token via middleware
    const user_id = req.user.id;
    const { meal_id } = req.body;

    const { error } = await supabase
        .from('meal_saves')
        .delete()
        .eq('user_id', user_id)
        .eq('meal_id', meal_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
};

module.exports = {
    getUserMeals,
    likeMeal,
    unlikeMeal,
    commentMeal,
    getMealComments,
    saveMeal,
    unsaveMeal,
    getMealById
};
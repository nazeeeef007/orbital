const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
const path = require('path');

exports.uploadMeal = async (req, res) => {
  try {
    const { recipe_text, calories, protein, carbs, fat } = req.body;
    const mealImage = req.files['meal_image']?.[0];
    const recipeImage = req.files['recipe_image']?.[0];

    if (!recipe_text || !calories || !protein || !carbs || !fat || !mealImage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    
    // Upload meal image to Supabase Storage
    const mealImageExt = path.extname(mealImage.originalname);
    const mealImagePath = `meals/${userId}/${Date.now()}-meal${mealImageExt}`;

    const { error: mealUploadError } = await supabase.storage
      .from('meal-images')
      .upload(mealImagePath, mealImage.buffer, {
        contentType: mealImage.mimetype,
        upsert: true,
      });

    if (mealUploadError) throw mealUploadError;

    const mealImageUrl = supabase.storage
      .from('meal-images')
      .getPublicUrl(mealImagePath).data.publicUrl;

    // Upload recipe image if present
    let recipeImageUrl = null;
    if (recipeImage) {
      const recipeImageExt = path.extname(recipeImage.originalname);
      const recipeImagePath = `recipes/${userId}/${Date.now()}-recipe${recipeImageExt}`;

      const { error: recipeUploadError } = await supabase.storage
        .from('recipe-images')
        .upload(recipeImagePath, recipeImage.buffer, {
          contentType: recipeImage.mimetype,
          upsert: true,
        });

      if (recipeUploadError) throw recipeUploadError;

      recipeImageUrl = supabase.storage
        .from('recipe-images')
        .getPublicUrl(recipeImagePath).data.publicUrl;
    }
    console.log("uploading meal..");
    // Insert into meals table
    const parsedCalories = parseFloat(calories);
    const parsedProtein = parseFloat(protein);
    const parsedCarbs = parseFloat(carbs);
    const parsedFat = parseFloat(fat);

    const { error: dbError } = await supabase.from('meals').insert([{
      user_id: userId,
      recipe_text,
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fat: parsedFat,
      meal_image_url: mealImageUrl,
      recipe_image_url: recipeImageUrl,
      created_at: new Date().toISOString(),
    }]);

    if (dbError) throw dbError;

    // Update user's profile values
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('daily_calories, daily_protein, daily_carbs, daily_fat')
      .eq('id', userId)
      .single();

    if (profileFetchError) throw profileFetchError;

    const updatedProfile = {
      daily_calories: (profile.daily_calories || 0) + parsedCalories,
      daily_protein: (profile.daily_protein || 0) + parsedProtein,
      daily_carbs: (profile.daily_carbs || 0) + parsedCarbs,
      daily_fat: (profile.daily_fat || 0) + parsedFat,
      daily_updated_at: new Date().toISOString(),
    };

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', userId); // Must match your RLS policy

    if (profileUpdateError) throw profileUpdateError;


    return res.status(200).json({ message: 'Meal uploaded and profile updated successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

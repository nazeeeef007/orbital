const supabase = require('../models/supabaseClient');
const path = require('path');
const fs = require('fs');

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

    const { data: mealUpload, error: mealUploadError } = await supabase.storage
      .from('meal-images')
      .upload(mealImagePath, fs.readFileSync(mealImage.path), {
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

      const { data: recipeUpload, error: recipeUploadError } = await supabase.storage
        .from('recipe-images')
        .upload(recipeImagePath, fs.readFileSync(recipeImage.path), {
          contentType: recipeImage.mimetype,
          upsert: true,
        });

      if (recipeUploadError) throw recipeUploadError;

      recipeImageUrl = supabase.storage
        .from('recipe-images')
        .getPublicUrl(recipeImagePath).data.publicUrl;
    }

    // Insert metadata into meals table
    const { error: dbError } = await supabase.from('meals').insert([
      {
        user_id: userId,
        recipe_text,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        meal_image_url: mealImageUrl,
        recipe_image_url: recipeImageUrl,
        created_at: new Date().toISOString(),
      },
    ]);

    if (dbError) throw dbError;

    return res.status(200).json({ message: 'Meal uploaded successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

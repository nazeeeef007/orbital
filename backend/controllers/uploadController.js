const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

const path = require('path');

const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


exports.uploadMealAi= async (req, res) => {
  try {
    const { recipe_text } = req.body;
    const mealImage = req.files['meal_image']?.[0];
    const recipeImage = req.files['recipe_image']?.[0];
    console.log(recipe_text);
    console.log(mealImage);
    if (!recipe_text || !mealImage) {
      return res.status(400).json({ error: 'Missing required fields: recipe_text and meal_image are required' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    // Call OpenAI to get macro estimation from recipe_text
    const context = `You are a nutrition expert specialized in Singaporean food. 
Given a meal description that may include the dish name, ingredients, and their weights, 
estimate the total macros: 'calories' (kcal), 'carbohydrates', 'protein', 'fat' (grams).
also give me  
Respond ONLY with a JSON object containing these keys with integer values. 
If the input is unclear or not food-related, respond with an error message in JSON.`;

    const messages = [
      { role: "system", content: context },
      { role: "user", content: recipe_text },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.3,
    });

    
    const answer = response.choices[0].message.content.trim();
    // Parse OpenAI JSON response
    let macros;
    try {
      macros = JSON.parse(answer);
    } catch (e) {
      console.log("Failed to parse JSON from AI response:", answer);
      return res.status(422).json({
        error: "AI response is not valid JSON. Possibly input unclear.",
        rawResponse: answer,
      });
    }

    // Validate macro keys and integer values
    const expectedKeys = ["calories", "carbohydrates", "protein", "fat"];
    const missingKeys = expectedKeys.filter(k => !(k in macros));
    if (missingKeys.length > 0) {
      return res.status(422).json({
        error: `Missing macro keys in AI response: ${missingKeys.join(", ")}`,
        data: macros,
      });
    }

    const invalidKeys = expectedKeys.filter(k => !Number.isInteger(macros[k]));
    if (invalidKeys.length > 0) {
      return res.status(422).json({
        error: `Invalid macro values (not integers) for keys: ${invalidKeys.join(", ")}`,
        data: macros,
      });
    }

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

    console.log("Uploading meal with estimated macros...");

    // Insert into meals table with macros from OpenAI
    const { calories, protein, carbohydrates, fat } = macros;

    const { error: dbError } = await supabase.from('meals').insert([{
      user_id: userId,
      recipe_text,
      calories,
      protein,
      carbs: carbohydrates,
      fat,
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
      daily_calories: (profile.daily_calories || 0) + calories,
      daily_protein: (profile.daily_protein || 0) + protein,
      daily_carbs: (profile.daily_carbs || 0) + carbohydrates,
      daily_fat: (profile.daily_fat || 0) + fat,
      daily_updated_at: new Date().toISOString(),
    };

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update(updatedProfile)
      .eq('id', userId);

    if (profileUpdateError) throw profileUpdateError;

    return res.status(200).json({
      message: 'Meal uploaded and profile updated successfully!',
      macros,
      meal_image_url: mealImageUrl,
      recipe_image_url: recipeImageUrl,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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

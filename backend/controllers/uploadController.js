const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');
const { redisClient } = require('../utils/redis');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.uploadMeal = async (req, res) => {
  console.log("reached upload");
  try {
    const {
      recipe_text, calories, protein, carbs, fat,
      cuisine, meal_time, diet_type, spice_level,
      prep_time_mins, price, location
    } = req.body;

    // Safely extract files
    const mealRaw = req.files['meal_image'];
    const recipeRaw = req.files['recipe_image'];
    const mealImage = Array.isArray(mealRaw) ? mealRaw[0] : mealRaw;
    const recipeImage = Array.isArray(recipeRaw) ? recipeRaw[0] : recipeRaw;
    
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
   console.log("req.files:", req.files['meal_image']);
    // Validate required fields
    if (!recipe_text || !calories || !protein || !carbs || !fat || !mealImage ||
        !cuisine || !meal_time || !diet_type || !spice_level) {
          console.log("Missing required fields");
          console.log("recipe_text:", recipe_text);
          console.log("calories:", calories);
          console.log("protein:", protein);
          console.log("carbs:", carbs);
          console.log("fat:", fat);
          console.log("mealImage:", mealImage);
          console.log("cuisine:", cuisine);
          console.log("meal_time:", meal_time);
          console.log("diet_type:", diet_type);
          console.log("spice_level:", spice_level);

      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isHomecooked = price === '0' && location === 'Homecooked';
     console.log("ok");
    if (isHomecooked) {
      if (!prep_time_mins || isNaN(prep_time_mins)) {
        return res.status(400).json({ error: 'prep_time_mins is required for homecooked meals' });
      }
    } else {
      if (!price || !location) {
        return res.status(400).json({ error: 'price and location are required for non-homecooked meals' });
      }
    }
    
    // Upload meal image
    const mealImagePath = `meals/${userId}/${Date.now()}-meal${path.extname(mealImage.originalname)}`;
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

    // Upload optional recipe image
    let recipeImageUrl = null;
    if (recipeImage) {
      const recipeImagePath = `recipes/${userId}/${Date.now()}-recipe${path.extname(recipeImage.originalname)}`;
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

    console.log("inserting into db");

    // Parse number values
    const parsedCalories = parseFloat(calories);
    const parsedProtein = parseFloat(protein);
    const parsedCarbs = parseFloat(carbs);
    const parsedFat = parseFloat(fat);
    const parsedPrice = parseFloat(price);
    const parsedPrepTime = prep_time_mins ? parseInt(prep_time_mins) : null;

    // Insert meal record
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
      cuisine,
      meal_time,
      diet_type,
      spice_level,
      prep_time_mins: isHomecooked ? parsedPrepTime : 0,
      price: isHomecooked ? 0 : parsedPrice,
      location: isHomecooked ? '' : location,
    }]);

    if (dbError) throw dbError;
    console.log("inserted meal into db");

    // Update profile nutrients
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
      .eq('id', userId);

    if (profileUpdateError) throw profileUpdateError;
    await redisClient.del(`user_profile:${userId}`);
    console.log(`🧹 Cleared Redis cache for profile of user ${userId}`);

    return res.status(200).json({ message: 'Meal uploaded and profile updated successfully!' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};



// const { OpenAI } = require('openai');
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });


// exports.uploadMealAi = async (req, res) => {
//   try {
//     const { recipe_text } = req.body;
//     const mealImage = req.files['meal_image']?.[0];

//     if (!recipe_text || !mealImage) {
//       return res.status(400).json({ error: 'Missing required fields: recipe_text and meal_image are required' });
//     }

//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ error: 'User not authenticated' });
//     console.log("analysing with ai!");

//     const context = `You are a nutrition expert specialized in Singaporean food. 
// Given a meal description that may include the dish name, ingredients, and their weights, 
// estimate the total macros: 'calories' (kcal), 'carbohydrates', 'protein', 'fat' (grams).
// Respond ONLY with a JSON object containing these keys with integer values. 
// If the input is unclear or not food-related, respond with an error message in JSON.`;

//     const messages = [
//       { role: "system", content: context },
//       { role: "user", content: recipe_text },
//     ];

//     const response = await openai.chat.completions.create({
//       model: "gpt-4.1-mini",
//       messages,
//       temperature: 0.3,
//     });

//     const answer = response.choices[0].message.content.trim();
//     let macros;
//     try {
//       macros = JSON.parse(answer);
//     } catch (e) {
//       return res.status(422).json({ error: "AI response is not valid JSON.", rawResponse: answer });
//     }

//     const expectedKeys = ["calories", "carbohydrates", "protein", "fat"];
//     const missingKeys = expectedKeys.filter(k => !(k in macros));
//     if (missingKeys.length > 0) {
//       return res.status(422).json({ error: `Missing keys: ${missingKeys.join(", ")}`, data: macros });
//     }

//     const invalidKeys = expectedKeys.filter(k => !Number.isInteger(macros[k]));
//     if (invalidKeys.length > 0) {
//       return res.status(422).json({ error: `Invalid macro values for: ${invalidKeys.join(", ")}`, data: macros });
//     }
//     console.log(macros);
//     return res.status(200).json({ macros }); // No DB insert
//   } catch (error) {
//     console.error('AI Macro Estimation Error:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };



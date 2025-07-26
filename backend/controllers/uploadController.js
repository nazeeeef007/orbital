const path = require('path');
const { redisClient } = require('../utils/redis');
const supabase = require('../utils/supabaseClient');

exports.uploadMeal = async (req, res) => {
  console.log("reached upload");
  try {
    const {
      recipe_text, calories, protein, carbs, fat,
      cuisine, meal_time, diet_type, spice_level,
      prep_time_mins, price, location
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // --- CRITICAL FIX: Safely access req.files and its properties ---
    // Check if req.files exists before trying to access its properties.
    // If req.files doesn't exist, mealRaw/recipeRaw will be undefined,
    // which then correctly makes mealImage/recipeImage undefined.
    const mealRaw = req.files?.['meal_image']; // Use optional chaining
    const recipeRaw = req.files?.['recipe_image']; // Use optional chaining

    // This logic is mostly fine, it correctly extracts the first file or keeps it undefined/null
    const mealImage = Array.isArray(mealRaw) ? mealRaw[0] : mealRaw;
    const recipeImage = Array.isArray(recipeRaw) ? recipeRaw[0] : recipeRaw;

    console.log("mealImage from req.files:", mealImage); // Now this won't error if req.files is undefined

    // Validate required fields (including mealImage)
    if (!recipe_text || !calories || !protein || !carbs || !fat || !mealImage ||
        !cuisine || !meal_time || !diet_type || !spice_level) {
          console.log("Missing required fields. Details:");
          console.log("recipe_text:", recipe_text);
          console.log("calories:", calories);
          console.log("protein:", protein);
          console.log("carbs:", carbs);
          console.log("fat:", fat);
          console.log("mealImage:", mealImage); // This will show undefined if the file was truly missing
          console.log("cuisine:", cuisine);
          console.log("meal_time:", meal_time);
          console.log("diet_type:", diet_type);
          console.log("spice_level:", spice_level);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isHomecooked = price === '0' && location === 'Homecooked';
    console.log("Meal type determined. Homecooked:", isHomecooked);

    if (isHomecooked) {
      if (!prep_time_mins || isNaN(parseFloat(prep_time_mins))) { // Use parseFloat for robustness
        return res.status(400).json({ error: 'prep_time_mins is required for homecooked meals and must be a number' });
      }
    } else {
      if (!price || !location || isNaN(parseFloat(price))) { // Also check price is a number
        return res.status(400).json({ error: 'price and location are required for non-homecooked meals, and price must be a number' });
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

    if (mealUploadError) {
      console.error('Supabase meal image upload error:', mealUploadError);
      throw mealUploadError; // Re-throw to be caught by the outer catch
    }

    const mealImageUrl = supabase.storage
      .from('meal-images')
      .getPublicUrl(mealImagePath).data.publicUrl;

    // Upload optional recipe image
    let recipeImageUrl = null;
    if (recipeImage) { // This check is correct: if recipeImage is null/undefined, it skips
      const recipeImagePath = `recipes/${userId}/${Date.now()}-recipe${path.extname(recipeImage.originalname)}`;
      const { error: recipeUploadError } = await supabase.storage
        .from('recipe-images')
        .upload(recipeImagePath, recipeImage.buffer, {
          contentType: recipeImage.mimetype,
          upsert: true,
        });

      if (recipeUploadError) {
        console.error('Supabase recipe image upload error:', recipeUploadError);
        throw recipeUploadError; // Re-throw to be caught by the outer catch
      }

      recipeImageUrl = supabase.storage
        .from('recipe-images')
        .getPublicUrl(recipeImagePath).data.publicUrl;
    }

    console.log("Inserting meal into database...");

    // Parse number values
    const parsedCalories = parseFloat(calories);
    const parsedProtein = parseFloat(protein);
    const parsedCarbs = parseFloat(carbs);
    const parsedFat = parseFloat(fat);
    const parsedPrice = isHomecooked ? 0 : parseFloat(price); // Ensure price is 0 for homecooked
    const parsedPrepTime = isHomecooked ? parseInt(prep_time_mins) : 0; // Ensure prep_time_mins is 0 for non-homecooked

    // Insert meal record
    const { error: dbError } = await supabase.from('meals').insert([{
      user_id: userId,
      recipe_text,
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fat: parsedFat,
      meal_image_url: mealImageUrl,
      recipe_image_url: recipeImageUrl, // Will be null if no recipeImage was provided
      created_at: new Date().toISOString(),
      cuisine,
      meal_time,
      diet_type,
      spice_level,
      prep_time_mins: parsedPrepTime, // Use parsed value
      price: parsedPrice, // Use parsed value
      location: isHomecooked ? '' : location, // Set location to empty string for homecooked
    }]);

    if (dbError) {
      console.error('Supabase DB insert error:', dbError);
      throw dbError; // Re-throw to be caught by the outer catch
    }
    console.log("Meal inserted into database.");

    // Update profile nutrients
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('daily_calories, daily_protein, daily_carbs, daily_fat')
      .eq('id', userId)
      .single();

    if (profileFetchError) {
      console.error('Supabase profile fetch error:', profileFetchError);
      throw profileFetchError; // Re-throw
    }

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

    if (profileUpdateError) {
      console.error('Supabase profile update error:', profileUpdateError);
      throw profileUpdateError; // Re-throw
    }
    await redisClient.del(`user_profile:${userId}`);
    console.log(`🧹 Cleared Redis cache for profile of user ${userId}`);

    return res.status(200).json({ message: 'Meal uploaded and profile updated successfully!' });
  } catch (error) {
    console.error('Upload error (caught in controller):', error);
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



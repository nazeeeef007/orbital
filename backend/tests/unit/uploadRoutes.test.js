const { uploadMeal } = require('../../controllers/uploadController');
const path = require('path');
const { redisClient } = require('../../utils/redis');
const supabase = require('../../utils/supabaseClient');

// Mock dependencies
jest.mock('path', () => ({
  extname: jest.fn(),
}));
jest.mock('../../utils/redis', () => ({
  redisClient: {
    del: jest.fn(),
  },
}));
jest.mock('../../utils/supabaseClient', () => ({
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(), // Will be mocked with specific return value in beforeEach
    })),
  },
  from: jest.fn(() => ({
    insert: jest.fn(),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(),
  })),
}));

// Common mock data
const mockUserId = 'test-user-id-123';
const mockMealImageBuffer = Buffer.from('mock-meal-image-data');
const mockRecipeImageBuffer = Buffer.from('mock-recipe-image-data');

const mockMealImage = {
  originalname: 'meal.jpg',
  mimetype: 'image/jpeg',
  buffer: mockMealImageBuffer,
};
const mockRecipeImage = {
  originalname: 'recipe.png',
  mimetype: 'image/png',
  buffer: mockRecipeImageBuffer,
};

describe('uploadMeal', () => {
  let req;
  let res;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Restore any spies if they were used

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    req = {
      user: { id: mockUserId },
      body: {},
      files: {
        meal_image: [],
        recipe_image: [],
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // --- Default mock implementations for Supabase methods ---
    // Ensure all Supabase calls return an object with data and error properties.
    supabase.storage.from.mockReturnThis(); // Essential for chaining .from().upload
    supabase.storage.from().upload.mockResolvedValue({ data: { path: 'mock/path' }, error: null });
    // getPublicUrl returns an object with a 'data' property
    supabase.storage.from().getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://mock.supabase.url/public/image.jpg' } });

    supabase.from.mockReturnThis(); // Essential for chaining .from().insert / .from().select
    supabase.from().insert.mockResolvedValue({ data: [{ id: 'mock-meal-id' }], error: null });
    supabase.from().select.mockReturnThis(); // For select().eq().single()
    supabase.from().eq.mockReturnThis(); // For select().eq().single()
    supabase.from().single.mockResolvedValue({
      data: {
        daily_calories: 100,
        daily_protein: 10,
        daily_carbs: 20,
        daily_fat: 5,
      },
      error: null,
    });
    supabase.from().update.mockResolvedValue({ data: [{ id: mockUserId }], error: null });
    redisClient.del.mockResolvedValue(1);

    path.extname.mockImplementation((filename) => {
      const lastDotIndex = filename.lastIndexOf('.');
      return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    });

    jest.spyOn(Date, 'now').mockReturnValue(1678886400000);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Successful Uploads', () => {
    it('should upload a non-homecooked meal with recipe image successfully', async () => {
      req.body = {
        recipe_text: 'Spaghetti Carbonara',
        calories: '600',
        protein: '30',
        carbs: '70',
        fat: '25',
        cuisine: 'Italian',
        meal_time: 'Dinner',
        diet_type: 'Omnivore',
        spice_level: 'Mild',
        price: '18.50',
        location: 'Restaurant XYZ',
      };
      // Explicitly set files for this test
      req.files = {
        meal_image: [mockMealImage],
        recipe_image: [mockRecipeImage],
      };

      // Ensure getPublicUrl returns the expected structure for both images
      supabase.storage.from('meal-images').getPublicUrl.mockReturnValue({ data: { publicUrl: '[http://mock.meal.url/meal.jpg](http://mock.meal.url/meal.jpg)' } });
      supabase.storage.from('recipe-images').getPublicUrl.mockReturnValue({ data: { publicUrl: '[http://mock.recipe.url/recipe.png](http://mock.recipe.url/recipe.png)' } });


      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal uploaded and profile updated successfully!' });

      // Verify Supabase Storage calls for meal image
      expect(supabase.storage.from).toHaveBeenCalledWith('meal-images');
      expect(supabase.storage.from().upload).toHaveBeenCalledWith(
        `meals/${mockUserId}/1678886400000-meal.jpg`,
        mockMealImage.buffer,
        { contentType: mockMealImage.mimetype, upsert: true }
      );
      expect(supabase.storage.from('meal-images').getPublicUrl).toHaveBeenCalledWith(`meals/${mockUserId}/1678886400000-meal.jpg`);

      // Verify Supabase Storage calls for recipe image
      expect(supabase.storage.from).toHaveBeenCalledWith('recipe-images');
      expect(supabase.storage.from().upload).toHaveBeenCalledWith(
        `recipes/${mockUserId}/1678886400000-recipe.png`,
        mockRecipeImage.buffer,
        { contentType: mockRecipeImage.mimetype, upsert: true }
      );
      expect(supabase.storage.from('recipe-images').getPublicUrl).toHaveBeenCalledWith(`recipes/${mockUserId}/1678886400000-recipe.png`);


      // Verify Supabase DB insert for meal
      expect(supabase.from).toHaveBeenCalledWith('meals');
      expect(supabase.from().insert).toHaveBeenCalledWith([{
        user_id: mockUserId,
        recipe_text: 'Spaghetti Carbonara',
        calories: 600,
        protein: 30,
        carbs: 70,
        fat: 25,
        meal_image_url: '[http://mock.meal.url/meal.jpg](http://mock.meal.url/meal.jpg)',
        recipe_image_url: '[http://mock.recipe.url/recipe.png](http://mock.recipe.url/recipe.png)',
        created_at: expect.any(String),
        cuisine: 'Italian',
        meal_time: 'Dinner',
        diet_type: 'Omnivore',
        spice_level: 'Mild',
        prep_time_mins: 0,
        price: 18.50,
        location: 'Restaurant XYZ',
      }]);

      // Verify profile update
      expect(supabase.from().select).toHaveBeenCalledWith('daily_calories, daily_protein, daily_carbs, daily_fat');
      expect(supabase.from().select().eq).toHaveBeenCalledWith('id', mockUserId);
      expect(supabase.from().select().eq().single).toHaveBeenCalled();
      expect(supabase.from().update).toHaveBeenCalledWith({
        daily_calories: 100 + 600,
        daily_protein: 10 + 30,
        daily_carbs: 20 + 70,
        daily_fat: 5 + 25,
        daily_updated_at: expect.any(String),
      });

      // Verify Redis cache invalidation
      expect(redisClient.del).toHaveBeenCalledWith(`user_profile:${mockUserId}`);
    });

    it('should upload a homecooked meal without recipe image successfully', async () => {
      req.body = {
        recipe_text: 'Homemade Chicken Soup',
        calories: '350',
        protein: '25',
        carbs: '30',
        fat: '15',
        cuisine: 'Comfort Food',
        meal_time: 'Lunch',
        diet_type: 'Omnivore',
        spice_level: 'None',
        prep_time_mins: '45',
        price: '0',
        location: 'Homecooked',
      };
      req.files = {
        meal_image: [mockMealImage],
        recipe_image: [],
      };
      // Ensure getPublicUrl returns the expected structure for the meal image
      supabase.storage.from('meal-images').getPublicUrl.mockReturnValueOnce({ data: { publicUrl: '[http://mock.meal.url/soup.jpg](http://mock.meal.url/soup.jpg)' } });


      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal uploaded and profile updated successfully!' });

      expect(supabase.storage.from().upload).toHaveBeenCalledWith(
        `meals/${mockUserId}/1678886400000-meal.jpg`,
        mockMealImage.buffer,
        { contentType: mockMealImage.mimetype, upsert: true }
      );
      expect(supabase.storage.from('meal-images').getPublicUrl).toHaveBeenCalledWith(`meals/${mockUserId}/1678886400000-meal.jpg`);

      expect(supabase.storage.from('recipe-images').upload).not.toHaveBeenCalled();
      expect(supabase.storage.from('recipe-images').getPublicUrl).not.toHaveBeenCalled();

      expect(supabase.from().insert).toHaveBeenCalledWith([{
        user_id: mockUserId,
        recipe_text: 'Homemade Chicken Soup',
        calories: 350,
        protein: 25,
        carbs: 30,
        fat: 15,
        meal_image_url: '[http://mock.meal.url/soup.jpg](http://mock.meal.url/soup.jpg)',
        recipe_image_url: null,
        created_at: expect.any(String),
        cuisine: 'Comfort Food',
        meal_time: 'Lunch',
        diet_type: 'Omnivore',
        spice_level: 'None',
        prep_time_mins: 45,
        price: 0,
        location: '',
      }]);

      expect(supabase.from().update).toHaveBeenCalledWith({
        daily_calories: 100 + 350,
        daily_protein: 10 + 25,
        daily_carbs: 20 + 30,
        daily_fat: 5 + 15,
        daily_updated_at: expect.any(String),
      });
      expect(redisClient.del).toHaveBeenCalledWith(`user_profile:${mockUserId}`);
    });
  });


  describe('Validation Errors (400 Bad Request)', () => {
    it('should return 401 if userId is missing (user not authenticated)', async () => {
      req.user = undefined;

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if recipe_text is missing', async () => {
      req.body = {
        calories: '500', protein: '20', carbs: '60', fat: '25',
        cuisine: 'Italian', meal_time: 'Dinner', diet_type: 'Omnivore', spice_level: 'Medium',
        price: '15.99', location: 'Restaurant A',
      };
      // Ensure mealImage is present so we test for recipe_text missing
      req.files = { meal_image: [mockMealImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if mealImage is missing', async () => {
      req.body = {
        recipe_text: 'Missing image test',
        calories: '500', protein: '20', carbs: '60', fat: '25',
        cuisine: 'Italian', meal_time: 'Dinner', diet_type: 'Omnivore', spice_level: 'Medium',
        price: '15.99', location: 'Restaurant A',
      };
      // This is the correct setup for mealImage missing: an empty array
      req.files = { meal_image: [], recipe_image: [mockRecipeImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if prep_time_mins is missing for homecooked meal', async () => {
      req.body = {
        recipe_text: 'Homecooked Test',
        calories: '300', protein: '15', carbs: '30', fat: '10',
        cuisine: 'Local', meal_time: 'Breakfast', diet_type: 'Vegetarian', spice_level: 'Mild',
        price: '0', location: 'Homecooked',
      };
      // Add meal image to ensure it's not a missing mealImage error
      req.files = { meal_image: [mockMealImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // --- UPDATED ERROR MESSAGE ---
      expect(res.json).toHaveBeenCalledWith({ error: 'prep_time_mins is required for homecooked meals and must be a number' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if prep_time_mins is NaN for homecooked meal', async () => {
      req.body = {
        recipe_text: 'Homecooked Test',
        calories: '300', protein: '15', carbs: '30', fat: '10',
        cuisine: 'Local', meal_time: 'Breakfast', diet_type: 'Vegetarian', spice_level: 'Mild',
        prep_time_mins: 'not-a-number',
        price: '0', location: 'Homecooked',
      };
      // Add meal image
      req.files = { meal_image: [mockMealImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // --- UPDATED ERROR MESSAGE ---
      expect(res.json).toHaveBeenCalledWith({ error: 'prep_time_mins is required for homecooked meals and must be a number' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if price is missing for non-homecooked meal', async () => {
      req.body = {
        recipe_text: 'Restaurant Test',
        calories: '700', protein: '40', carbs: '80', fat: '30',
        cuisine: 'Mexican', meal_time: 'Lunch', diet_type: 'Omnivore', spice_level: 'Hot',
        location: 'Taco Stand',
      };
      // Add meal image
      req.files = { meal_image: [mockMealImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // --- UPDATED ERROR MESSAGE ---
      expect(res.json).toHaveBeenCalledWith({ error: 'price and location are required for non-homecooked meals, and price must be a number' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    it('should return 400 if location is missing for non-homecooked meal', async () => {
      req.body = {
        recipe_text: 'Restaurant Test',
        calories: '700', protein: '40', carbs: '80', fat: '30',
        cuisine: 'Mexican', meal_time: 'Lunch', diet_type: 'Omnivore', spice_level: 'Hot',
        price: '12.00',
      };
      // Add meal image
      req.files = { meal_image: [mockMealImage] };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // --- UPDATED ERROR MESSAGE ---
      expect(res.json).toHaveBeenCalledWith({ error: 'price and location are required for non-homecooked meals, and price must be a number' });
      expect(supabase.storage.from().upload).not.toHaveBeenCalled();
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });
  });


  describe('Error Handling (500 Internal Server Error)', () => {
    it('should return 500 if meal image upload fails', async () => {
      req.body = {
        recipe_text: 'Error Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = { meal_image: [mockMealImage] };

      // Ensure the mock returns an object with `data: null` and an `error` property
      supabase.storage.from().upload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed') });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      // Controller now logs 'Upload error (caught in controller):'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error (caught in controller):', expect.any(Error));
      expect(supabase.from().insert).not.toHaveBeenCalled();
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should return 500 if recipe image upload fails (when present)', async () => {
      req.body = {
        recipe_text: 'Error Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = { meal_image: [mockMealImage], recipe_image: [mockRecipeImage] };

      // Mock first upload (meal image) success, second (recipe image) failure
      supabase.storage.from().upload
        .mockResolvedValueOnce({ data: { path: 'mock/meal/path' }, error: null }) // Meal image upload succeeds
        .mockResolvedValueOnce({ data: null, error: new Error('Recipe upload failed') }); // Recipe image upload fails

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      // Controller now logs 'Upload error (caught in controller):'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error (caught in controller):', expect.any(Error));
      expect(supabase.from().insert).not.toHaveBeenCalled();
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should return 500 if meal DB insert fails', async () => {
      req.body = {
        recipe_text: 'Error Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = { meal_image: [mockMealImage] };

      supabase.from().insert.mockResolvedValueOnce({ data: null, error: new Error('DB insert failed') });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      // Controller now logs 'Upload error (caught in controller):'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error (caught in controller):', expect.any(Error));
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should return 500 if profile fetch fails', async () => {
      req.body = {
        recipe_text: 'Error Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = { meal_image: [mockMealImage] };

      supabase.from().select().eq().single.mockResolvedValueOnce({ data: null, error: new Error('Profile fetch failed') });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      // Controller now logs 'Upload error (caught in controller):'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error (caught in controller):', expect.any(Error));
      expect(supabase.from().update).not.toHaveBeenCalled();
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should return 500 if profile update fails', async () => {
      req.body = {
        recipe_text: 'Error Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = { meal_image: [mockMealImage] };

      supabase.from().update.mockResolvedValueOnce({ data: null, error: new Error('Profile update failed') });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      // Controller now logs 'Upload error (caught in controller):'
      expect(consoleErrorSpy).toHaveBeenCalledWith('Upload error (caught in controller):', expect.any(Error));
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });

 
  describe('Data Parsing and Logic', () => {
    it('should correctly parse and store numeric values as floats/integers', async () => {
      req.body = {
        recipe_text: 'Numeric Test',
        calories: '555.5',
        protein: '22.2',
        carbs: '66.6',
        fat: '11.1',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        prep_time_mins: '99',
        price: '0.00',
        location: 'Homecooked',
      };
      req.files = { meal_image: [mockMealImage] };

      // Ensure getPublicUrl returns the expected structure
      supabase.storage.from('meal-images').getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'http://mock.meal.url/parsed.jpg' } });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(supabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          calories: 555.5,
          protein: 22.2,
          carbs: 66.6,
          fat: 11.1,
          prep_time_mins: 99,
          price: 0,
        })
      ]);
      expect(supabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          daily_calories: 100 + 555.5,
          daily_protein: 10 + 22.2,
          daily_carbs: 20 + 66.6,
          daily_fat: 5 + 11.1,
        })
      );
    });

    it('should handle `req.files` being undefined gracefully', async () => {
      req.body = {
        recipe_text: 'Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      // Directly set req.files to undefined for this specific test
      req.files = undefined;

      await uploadMeal(req, res);

      // Now, we expect 400 because your controller should ideally handle
      // missing `req.files.meal_image` as a bad request.
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
      // The controller's console.log will show `undefined` for mealImage if it tries to access it
      expect(consoleLogSpy).toHaveBeenCalledWith("mealImage:", undefined);
    });

    it('should handle `req.files[imageKey]` being undefined or an empty array', async () => {
      req.body = {
        recipe_text: 'Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = {
        // meal_image is explicitly an empty array
        meal_image: [],
        recipe_image: [mockRecipeImage]
      };

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
      // Should log undefined because mealImage will be req.files.meal_image[0] which is undefined
      expect(consoleLogSpy).toHaveBeenCalledWith("mealImage:", undefined);
    });

    it('should handle recipeRaw being undefined or an empty array when no recipe image is provided', async () => {
      req.body = {
        recipe_text: 'Test', calories: '100', protein: '10', carbs: '10', fat: '10',
        cuisine: 'Test', meal_time: 'Test', diet_type: 'Test', spice_level: 'Test',
        price: '1', location: 'Test',
      };
      req.files = {
        meal_image: [mockMealImage],
        recipe_image: [], // Empty array for recipe_image
      };

      // Ensure meal image public URL is mocked for success
      supabase.storage.from('meal-images').getPublicUrl.mockReturnValueOnce({ data: { publicUrl: 'http://mock.meal.url/test.jpg' } });

      await uploadMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal uploaded and profile updated successfully!' });
      expect(supabase.storage.from('recipe-images').upload).not.toHaveBeenCalled();
      expect(supabase.storage.from('recipe-images').getPublicUrl).not.toHaveBeenCalled(); // Ensure this is not called
      expect(supabase.from().insert).toHaveBeenCalledWith([
        expect.objectContaining({
          recipe_image_url: null,
        })
      ]);
    });
  });
});
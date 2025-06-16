import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';
import { Meal } from '@/types/meal'

export const mealApi = {
  fetchMeals: async (): Promise<Meal[]> => {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${BASE_URL}/api/meals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  deleteMeal: async (mealId: number) => {
    return;
  },

  uploadMeal: async ({
    mealImage,
    recipeImage,
    recipeText,
    calories,
    protein,
    carbs,
    fat,
  }: {
    mealImage: any;
    recipeImage: any;
    recipeText: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) throw new Error('Authentication token not found');

    const formData = new FormData();
    formData.append('meal_image', {
      uri: mealImage.uri,
      name: 'meal.jpg',
      type: 'image/jpeg',
    });

    if (recipeImage) {
      formData.append('recipe_image', {
        uri: recipeImage.uri,
        name: 'recipe.jpg',
        type: 'image/jpeg',
      });
    }

    formData.append('recipe_text', recipeText);
    formData.append('calories', calories);
    formData.append('protein', protein);
    formData.append('carbs', carbs);
    formData.append('fat', fat);

    const response = await fetch(`${BASE_URL}/api/upload/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  },
};



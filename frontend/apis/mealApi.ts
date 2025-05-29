import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';

export const mealApi = {
  fetchMeals: async () => {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`http://${BASE_URL}:3000/api/meals`, {
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

  
};


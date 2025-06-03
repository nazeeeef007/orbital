export interface Meal {
  id: string;
  user_id: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  created_at: string;
  meal_image_url: string;
  recipe_text: string;
  recipe_image_url: string | null;
}
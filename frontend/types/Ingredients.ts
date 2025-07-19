export interface Ingredient {
    id: string; // uuid
    name: string;
    weight: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    calories: number | null;
    created_at: string;
    updated_at: string;
}
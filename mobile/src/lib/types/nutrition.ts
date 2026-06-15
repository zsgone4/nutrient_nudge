// Comprehensive nutrition types for tracking calories and micronutrients

export interface Macronutrients {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
}

export interface Micronutrients {
  // Vitamins (in mg unless specified)
  vitaminA: number; // mcg RAE
  vitaminB1: number; // mg (Thiamin)
  vitaminB2: number; // mg (Riboflavin)
  vitaminB3: number; // mg (Niacin)
  vitaminB5: number; // mg (Pantothenic Acid)
  vitaminB6: number; // mg
  vitaminB7: number; // mcg (Biotin)
  vitaminB9: number; // mcg (Folate)
  vitaminB12: number; // mcg
  vitaminC: number; // mg
  vitaminD: number; // mcg
  vitaminE: number; // mg
  vitaminK: number; // mcg

  // Minerals (in mg unless specified)
  calcium: number;
  iron: number;
  magnesium: number;
  phosphorus: number;
  potassium: number;
  sodium: number;
  zinc: number;
  copper: number; // mg
  manganese: number; // mg
  selenium: number; // mcg
  chromium: number; // mcg
  iodine: number; // mcg
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: number; // grams
  servingUnit: string;
  macros: Macronutrients;
  micros: Micronutrients;
  category: FoodCategory;
  image?: string;
  // Micronutrient provenance (set by the backend). PROXY = borrowed/estimated.
  microStatus?: 'MEASURED' | 'PROXY' | 'NONE';
  microMatchName?: string | null;
}

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'protein'
  | 'dairy'
  | 'fats'
  | 'snacks'
  | 'beverages'
  | 'prepared';

export interface FoodLogEntry {
  id: string;
  food: Food;
  servings: number;
  mealType: MealType;
  timestamp: number;
  date: string; // YYYY-MM-DD format
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DailyGoals {
  macros: Macronutrients;
  micros: Micronutrients;
}

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'aggressive_cut' | 'conservative_cut' | 'maintain' | 'conservative_bulk' | 'aggressive_bulk';

export interface UserProfile {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  isSetup: boolean;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  aggressive_cut: -0.25,
  conservative_cut: -0.

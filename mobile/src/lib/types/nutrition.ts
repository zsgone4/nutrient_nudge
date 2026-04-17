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
  conservative_cut: -0.10,
  maintain: 0,
  conservative_bulk: 0.10,
  aggressive_bulk: 0.25,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little exercise)',
  light: 'Light (1-3 days/week)',
  moderate: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very Active (intense daily)',
};

export const GOAL_LABELS: Record<Goal, { title: string; description: string }> = {
  aggressive_cut: { title: 'Aggressive Cut', description: '-25% for rapid loss' },
  conservative_cut: { title: 'Steady Cut', description: '-10% for consistent loss' },
  maintain: { title: 'Maintain', description: 'Keep current weight' },
  conservative_bulk: { title: 'Lean Bulk', description: '+10% for lean gains' },
  aggressive_bulk: { title: 'Aggressive Bulk', description: '+25% for rapid gains' },
};

export interface DailyLog {
  date: string;
  entries: FoodLogEntry[];
  totals: {
    macros: Macronutrients;
    micros: Micronutrients;
  };
}

// Recommended Daily Values (RDV) for adults
export const DAILY_VALUES: { macros: Macronutrients; micros: Micronutrients } = {
  macros: {
    calories: 2000,
    protein: 50,
    carbohydrates: 275,
    fat: 78,
    fiber: 28,
    sugar: 50,
  },
  micros: {
    vitaminA: 900,
    vitaminB1: 1.2,
    vitaminB2: 1.3,
    vitaminB3: 16,
    vitaminB5: 5,
    vitaminB6: 1.7,
    vitaminB7: 30,
    vitaminB9: 400,
    vitaminB12: 2.4,
    vitaminC: 90,
    vitaminD: 20,
    vitaminE: 15,
    vitaminK: 120,
    calcium: 1000,
    iron: 18,
    magnesium: 420,
    phosphorus: 700,
    potassium: 4700,
    sodium: 2300,
    zinc: 11,
    copper: 0.9,
    manganese: 2.3,
    selenium: 55,
    chromium: 35,
    iodine: 150,
  },
};

// Micronutrient display info
export const MICRONUTRIENT_INFO: Record<keyof Micronutrients, { name: string; unit: string; category: string; description: string }> = {
  vitaminA: { name: 'Vitamin A', unit: 'mcg', category: 'Fat-Soluble Vitamins', description: 'Vision, immune function, skin health' },
  vitaminB1: { name: 'Vitamin B1', unit: 'mg', category: 'B Vitamins', description: 'Thiamin - Energy metabolism, nerve function' },
  vitaminB2: { name: 'Vitamin B2', unit: 'mg', category: 'B Vitamins', description: 'Riboflavin - Energy production, cell function' },
  vitaminB3: { name: 'Vitamin B3', unit: 'mg', category: 'B Vitamins', description: 'Niacin - Digestion, skin health, nerve function' },
  vitaminB5: { name: 'Vitamin B5', unit: 'mg', category: 'B Vitamins', description: 'Pantothenic Acid - Hormone synthesis, metabolism' },
  vitaminB6: { name: 'Vitamin B6', unit: 'mg', category: 'B Vitamins', description: 'Brain development, immune function' },
  vitaminB7: { name: 'Vitamin B7', unit: 'mcg', category: 'B Vitamins', description: 'Biotin - Hair, skin, nail health' },
  vitaminB9: { name: 'Vitamin B9', unit: 'mcg', category: 'B Vitamins', description: 'Folate - Cell division, DNA synthesis' },
  vitaminB12: { name: 'Vitamin B12', unit: 'mcg', category: 'B Vitamins', description: 'Red blood cells, nerve function, DNA synthesis' },
  vitaminC: { name: 'Vitamin C', unit: 'mg', category: 'Water-Soluble Vitamins', description: 'Immune support, collagen synthesis, antioxidant' },
  vitaminD: { name: 'Vitamin D', unit: 'mcg', category: 'Fat-Soluble Vitamins', description: 'Bone health, immune function, mood' },
  vitaminE: { name: 'Vitamin E', unit: 'mg', category: 'Fat-Soluble Vitamins', description: 'Antioxidant, skin health, immune support' },
  vitaminK: { name: 'Vitamin K', unit: 'mcg', category: 'Fat-Soluble Vitamins', description: 'Blood clotting, bone metabolism' },
  calcium: { name: 'Calcium', unit: 'mg', category: 'Major Minerals', description: 'Bone health, muscle function, nerve signaling' },
  iron: { name: 'Iron', unit: 'mg', category: 'Trace Minerals', description: 'Oxygen transport, energy production' },
  magnesium: { name: 'Magnesium', unit: 'mg', category: 'Major Minerals', description: 'Muscle/nerve function, blood sugar control' },
  phosphorus: { name: 'Phosphorus', unit: 'mg', category: 'Major Minerals', description: 'Bone health, energy storage' },
  potassium: { name: 'Potassium', unit: 'mg', category: 'Major Minerals', description: 'Heart rhythm, muscle contractions, fluid balance' },
  sodium: { name: 'Sodium', unit: 'mg', category: 'Major Minerals', description: 'Fluid balance, nerve function' },
  zinc: { name: 'Zinc', unit: 'mg', category: 'Trace Minerals', description: 'Immune function, wound healing, taste/smell' },
  copper: { name: 'Copper', unit: 'mg', category: 'Trace Minerals', description: 'Iron metabolism, connective tissue' },
  manganese: { name: 'Manganese', unit: 'mg', category: 'Trace Minerals', description: 'Bone formation, metabolism' },
  selenium: { name: 'Selenium', unit: 'mcg', category: 'Trace Minerals', description: 'Thyroid function, antioxidant defense' },
  chromium: { name: 'Chromium', unit: 'mcg', category: 'Trace Minerals', description: 'Blood sugar regulation' },
  iodine: { name: 'Iodine', unit: 'mcg', category: 'Trace Minerals', description: 'Thyroid hormone production' },
};

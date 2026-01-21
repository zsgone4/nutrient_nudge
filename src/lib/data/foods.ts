import { Food, Micronutrients, Macronutrients } from '../types/nutrition';

// Helper to create empty micros (most foods won't have all values)
const emptyMicros: Micronutrients = {
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
  vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
  phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
  selenium: 0, chromium: 0, iodine: 0,
};

// Comprehensive food database with realistic nutrition data
export const FOOD_DATABASE: Food[] = [
  // FRUITS
  {
    id: 'banana-medium',
    name: 'Banana',
    servingSize: 118,
    servingUnit: '1 medium',
    category: 'fruits',
    macros: { calories: 105, protein: 1.3, carbohydrates: 27, fat: 0.4, fiber: 3.1, sugar: 14 },
    micros: { ...emptyMicros, vitaminB6: 0.43, vitaminC: 10.3, potassium: 422, magnesium: 32, manganese: 0.32 },
  },
  {
    id: 'apple-medium',
    name: 'Apple',
    servingSize: 182,
    servingUnit: '1 medium',
    category: 'fruits',
    macros: { calories: 95, protein: 0.5, carbohydrates: 25, fat: 0.3, fiber: 4.4, sugar: 19 },
    micros: { ...emptyMicros, vitaminC: 8.4, potassium: 195, vitaminK: 4 },
  },
  {
    id: 'orange-medium',
    name: 'Orange',
    servingSize: 131,
    servingUnit: '1 medium',
    category: 'fruits',
    macros: { calories: 62, protein: 1.2, carbohydrates: 15, fat: 0.2, fiber: 3.1, sugar: 12 },
    micros: { ...emptyMicros, vitaminC: 70, vitaminB9: 40, potassium: 237, calcium: 52, vitaminB1: 0.11 },
  },
  {
    id: 'blueberries-cup',
    name: 'Blueberries',
    servingSize: 148,
    servingUnit: '1 cup',
    category: 'fruits',
    macros: { calories: 84, protein: 1.1, carbohydrates: 21, fat: 0.5, fiber: 3.6, sugar: 15 },
    micros: { ...emptyMicros, vitaminC: 14.4, vitaminK: 28.6, manganese: 0.5, vitaminE: 0.84 },
  },
  {
    id: 'strawberries-cup',
    name: 'Strawberries',
    servingSize: 152,
    servingUnit: '1 cup',
    category: 'fruits',
    macros: { calories: 49, protein: 1, carbohydrates: 12, fat: 0.5, fiber: 3, sugar: 7 },
    micros: { ...emptyMicros, vitaminC: 89, manganese: 0.6, vitaminB9: 36, potassium: 233 },
  },
  {
    id: 'avocado-half',
    name: 'Avocado',
    servingSize: 100,
    servingUnit: '1/2 medium',
    category: 'fruits',
    macros: { calories: 160, protein: 2, carbohydrates: 9, fat: 15, fiber: 7, sugar: 0.7 },
    micros: { ...emptyMicros, vitaminK: 21, vitaminB9: 81, vitaminB6: 0.26, vitaminC: 10, potassium: 485, vitaminE: 2.1 },
  },

  // VEGETABLES
  {
    id: 'spinach-cup-raw',
    name: 'Spinach (raw)',
    servingSize: 30,
    servingUnit: '1 cup',
    category: 'vegetables',
    macros: { calories: 7, protein: 0.9, carbohydrates: 1.1, fat: 0.1, fiber: 0.7, sugar: 0.1 },
    micros: { ...emptyMicros, vitaminA: 141, vitaminK: 145, vitaminB9: 58, vitaminC: 8.4, iron: 0.8, magnesium: 24, manganese: 0.27 },
  },
  {
    id: 'broccoli-cup',
    name: 'Broccoli (cooked)',
    servingSize: 156,
    servingUnit: '1 cup',
    category: 'vegetables',
    macros: { calories: 55, protein: 3.7, carbohydrates: 11, fat: 0.6, fiber: 5.1, sugar: 2.2 },
    micros: { ...emptyMicros, vitaminC: 101, vitaminK: 220, vitaminA: 120, vitaminB9: 168, potassium: 457, chromium: 22 },
  },
  {
    id: 'sweet-potato-medium',
    name: 'Sweet Potato',
    servingSize: 130,
    servingUnit: '1 medium',
    category: 'vegetables',
    macros: { calories: 112, protein: 2, carbohydrates: 26, fat: 0.1, fiber: 3.9, sugar: 5.4 },
    micros: { ...emptyMicros, vitaminA: 1096, vitaminC: 22, vitaminB6: 0.29, potassium: 438, manganese: 0.5 },
  },
  {
    id: 'carrots-cup',
    name: 'Carrots',
    servingSize: 128,
    servingUnit: '1 cup chopped',
    category: 'vegetables',
    macros: { calories: 52, protein: 1.2, carbohydrates: 12, fat: 0.3, fiber: 3.6, sugar: 6 },
    micros: { ...emptyMicros, vitaminA: 1069, vitaminK: 16.9, vitaminC: 7.6, potassium: 410, vitaminB7: 6.1 },
  },
  {
    id: 'kale-cup',
    name: 'Kale (raw)',
    servingSize: 67,
    servingUnit: '1 cup chopped',
    category: 'vegetables',
    macros: { calories: 33, protein: 2.2, carbohydrates: 6, fat: 0.5, fiber: 1.3, sugar: 1.6 },
    micros: { ...emptyMicros, vitaminA: 206, vitaminK: 547, vitaminC: 80, vitaminB6: 0.18, manganese: 0.5, calcium: 90 },
  },
  {
    id: 'bell-pepper-red',
    name: 'Red Bell Pepper',
    servingSize: 149,
    servingUnit: '1 medium',
    category: 'vegetables',
    macros: { calories: 46, protein: 1.5, carbohydrates: 9, fat: 0.4, fiber: 3.1, sugar: 6.3 },
    micros: { ...emptyMicros, vitaminC: 190, vitaminA: 234, vitaminB6: 0.4, vitaminE: 2.4, vitaminB9: 68 },
  },

  // PROTEINS
  {
    id: 'chicken-breast',
    name: 'Chicken Breast (grilled)',
    servingSize: 140,
    servingUnit: '5 oz',
    category: 'protein',
    macros: { calories: 231, protein: 43, carbohydrates: 0, fat: 5, fiber: 0, sugar: 0 },
    micros: { ...emptyMicros, vitaminB3: 14.4, vitaminB6: 0.87, vitaminB12: 0.35, selenium: 36, phosphorus: 300, zinc: 1.4 },
  },
  {
    id: 'salmon-fillet',
    name: 'Salmon (baked)',
    servingSize: 170,
    servingUnit: '6 oz fillet',
    category: 'protein',
    macros: { calories: 367, protein: 39, carbohydrates: 0, fat: 22, fiber: 0, sugar: 0 },
    micros: { ...emptyMicros, vitaminB12: 4.9, vitaminD: 14.2, vitaminB3: 12.6, vitaminB6: 1.2, selenium: 58, phosphorus: 420 },
  },
  {
    id: 'eggs-large',
    name: 'Egg (large)',
    servingSize: 50,
    servingUnit: '1 large',
    category: 'protein',
    macros: { calories: 78, protein: 6.3, carbohydrates: 0.6, fat: 5.3, fiber: 0, sugar: 0.6 },
    micros: { ...emptyMicros, vitaminB12: 0.65, vitaminD: 1.1, vitaminB2: 0.23, selenium: 15.4, vitaminA: 80, vitaminB7: 10 },
  },
  {
    id: 'beef-ground-lean',
    name: 'Ground Beef (90% lean)',
    servingSize: 113,
    servingUnit: '4 oz',
    category: 'protein',
    macros: { calories: 199, protein: 23, carbohydrates: 0, fat: 11, fiber: 0, sugar: 0 },
    micros: { ...emptyMicros, vitaminB12: 2.5, zinc: 5.7, iron: 2.6, vitaminB3: 5.3, vitaminB6: 0.4, selenium: 20 },
  },
  {
    id: 'tofu-firm',
    name: 'Tofu (firm)',
    servingSize: 126,
    servingUnit: '1/2 cup',
    category: 'protein',
    macros: { calories: 94, protein: 10, carbohydrates: 2.3, fat: 5, fiber: 0.5, sugar: 0.5 },
    micros: { ...emptyMicros, calcium: 253, iron: 2.2, magnesium: 37, selenium: 12, phosphorus: 121, manganese: 0.8 },
  },
  {
    id: 'lentils-cooked',
    name: 'Lentils (cooked)',
    servingSize: 198,
    servingUnit: '1 cup',
    category: 'protein',
    macros: { calories: 230, protein: 18, carbohydrates: 40, fat: 0.8, fiber: 16, sugar: 3.6 },
    micros: { ...emptyMicros, vitaminB9: 358, iron: 6.6, vitaminB1: 0.33, vitaminB6: 0.35, phosphorus: 356, potassium: 731, manganese: 1 },
  },

  // DAIRY
  {
    id: 'greek-yogurt',
    name: 'Greek Yogurt (plain, nonfat)',
    servingSize: 170,
    servingUnit: '6 oz',
    category: 'dairy',
    macros: { calories: 100, protein: 17, carbohydrates: 6, fat: 0.7, fiber: 0, sugar: 4 },
    micros: { ...emptyMicros, vitaminB12: 1.3, calcium: 187, phosphorus: 229, vitaminB2: 0.27, iodine: 50 },
  },
  {
    id: 'milk-whole',
    name: 'Milk (whole)',
    servingSize: 244,
    servingUnit: '1 cup',
    category: 'dairy',
    macros: { calories: 149, protein: 8, carbohydrates: 12, fat: 8, fiber: 0, sugar: 12 },
    micros: { ...emptyMicros, vitaminD: 3.2, vitaminB12: 1.1, calcium: 276, phosphorus: 205, vitaminB2: 0.45, potassium: 322, iodine: 56 },
  },
  {
    id: 'cheese-cheddar',
    name: 'Cheddar Cheese',
    servingSize: 28,
    servingUnit: '1 oz',
    category: 'dairy',
    macros: { calories: 113, protein: 7, carbohydrates: 0.4, fat: 9.3, fiber: 0, sugar: 0.1 },
    micros: { ...emptyMicros, vitaminA: 75, vitaminB12: 0.24, calcium: 200, phosphorus: 145, zinc: 0.9, selenium: 4 },
  },
  {
    id: 'cottage-cheese',
    name: 'Cottage Cheese (low-fat)',
    servingSize: 226,
    servingUnit: '1 cup',
    category: 'dairy',
    macros: { calories: 163, protein: 28, carbohydrates: 6, fat: 2.3, fiber: 0, sugar: 6 },
    micros: { ...emptyMicros, vitaminB12: 1.4, calcium: 138, phosphorus: 302, selenium: 20, sodium: 918 },
  },

  // GRAINS
  {
    id: 'rice-brown-cup',
    name: 'Brown Rice (cooked)',
    servingSize: 195,
    servingUnit: '1 cup',
    category: 'grains',
    macros: { calories: 216, protein: 5, carbohydrates: 45, fat: 1.8, fiber: 3.5, sugar: 0.7 },
    micros: { ...emptyMicros, manganese: 1.8, magnesium: 84, selenium: 19, vitaminB3: 3, vitaminB1: 0.2, phosphorus: 162 },
  },
  {
    id: 'oatmeal-cup',
    name: 'Oatmeal (cooked)',
    servingSize: 234,
    servingUnit: '1 cup',
    category: 'grains',
    macros: { calories: 158, protein: 6, carbohydrates: 27, fat: 3.2, fiber: 4, sugar: 1.1 },
    micros: { ...emptyMicros, manganese: 1.4, phosphorus: 180, magnesium: 56, iron: 2.1, zinc: 1.5, vitaminB1: 0.26 },
  },
  {
    id: 'bread-whole-wheat',
    name: 'Whole Wheat Bread',
    servingSize: 43,
    servingUnit: '1 slice',
    category: 'grains',
    macros: { calories: 91, protein: 4.3, carbohydrates: 15, fat: 1.4, fiber: 2.4, sugar: 2.4 },
    micros: { ...emptyMicros, manganese: 0.7, selenium: 11, vitaminB1: 0.12, vitaminB9: 22, iron: 1 },
  },
  {
    id: 'quinoa-cup',
    name: 'Quinoa (cooked)',
    servingSize: 185,
    servingUnit: '1 cup',
    category: 'grains',
    macros: { calories: 222, protein: 8, carbohydrates: 39, fat: 3.5, fiber: 5, sugar: 2 },
    micros: { ...emptyMicros, manganese: 1.2, magnesium: 118, phosphorus: 281, vitaminB9: 78, iron: 2.8, zinc: 2 },
  },

  // FATS & NUTS
  {
    id: 'almonds',
    name: 'Almonds',
    servingSize: 28,
    servingUnit: '1 oz (23 nuts)',
    category: 'fats',
    macros: { calories: 164, protein: 6, carbohydrates: 6, fat: 14, fiber: 3.5, sugar: 1.2 },
    micros: { ...emptyMicros, vitaminE: 7.3, magnesium: 76, manganese: 0.6, vitaminB2: 0.29, phosphorus: 136, copper: 0.3 },
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    servingSize: 28,
    servingUnit: '1 oz',
    category: 'fats',
    macros: { calories: 185, protein: 4.3, carbohydrates: 3.9, fat: 18.5, fiber: 1.9, sugar: 0.7 },
    micros: { ...emptyMicros, manganese: 1, copper: 0.45, vitaminB6: 0.15, magnesium: 44, phosphorus: 98 },
  },
  {
    id: 'olive-oil',
    name: 'Olive Oil',
    servingSize: 14,
    servingUnit: '1 tbsp',
    category: 'fats',
    macros: { calories: 119, protein: 0, carbohydrates: 0, fat: 13.5, fiber: 0, sugar: 0 },
    micros: { ...emptyMicros, vitaminE: 1.9, vitaminK: 8.1 },
  },
  {
    id: 'peanut-butter',
    name: 'Peanut Butter',
    servingSize: 32,
    servingUnit: '2 tbsp',
    category: 'fats',
    macros: { calories: 188, protein: 8, carbohydrates: 6, fat: 16, fiber: 1.9, sugar: 3 },
    micros: { ...emptyMicros, vitaminE: 2.9, vitaminB3: 4.2, magnesium: 49, phosphorus: 107, manganese: 0.5 },
  },

  // SNACKS
  {
    id: 'dark-chocolate',
    name: 'Dark Chocolate (70-85%)',
    servingSize: 28,
    servingUnit: '1 oz',
    category: 'snacks',
    macros: { calories: 170, protein: 2.2, carbohydrates: 13, fat: 12, fiber: 3.1, sugar: 6.8 },
    micros: { ...emptyMicros, iron: 3.3, magnesium: 64, copper: 0.5, manganese: 0.5, phosphorus: 87, zinc: 0.9 },
  },
  {
    id: 'hummus',
    name: 'Hummus',
    servingSize: 62,
    servingUnit: '1/4 cup',
    category: 'snacks',
    macros: { calories: 109, protein: 3, carbohydrates: 10, fat: 6.5, fiber: 2, sugar: 0.5 },
    micros: { ...emptyMicros, vitaminB9: 36, iron: 1.5, vitaminB6: 0.2, manganese: 0.4, phosphorus: 88 },
  },

  // BEVERAGES
  {
    id: 'orange-juice',
    name: 'Orange Juice (fresh)',
    servingSize: 248,
    servingUnit: '1 cup',
    category: 'beverages',
    macros: { calories: 112, protein: 1.7, carbohydrates: 26, fat: 0.5, fiber: 0.5, sugar: 21 },
    micros: { ...emptyMicros, vitaminC: 124, vitaminB9: 74, potassium: 496, vitaminB1: 0.22 },
  },
];

// Helper function to search foods
export function searchFoods(query: string): Food[] {
  const lowerQuery = query.toLowerCase();
  return FOOD_DATABASE.filter(
    food =>
      food.name.toLowerCase().includes(lowerQuery) ||
      food.category.toLowerCase().includes(lowerQuery)
  );
}

// Helper function to get foods by category
export function getFoodsByCategory(category: string): Food[] {
  return FOOD_DATABASE.filter(food => food.category === category);
}

import { Food, Micronutrients } from '@/lib/types/nutrition';
import { log } from '@/lib/logger';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export interface SavedMealItem {
  servings: number;
  food: Food;
}

export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  items: SavedMealItem[];
}

const MICRO_KEYS: (keyof Micronutrients)[] = [
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5', 'vitaminB6',
  'vitaminB7', 'vitaminB9', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE',
  'vitaminK', 'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium',
  'sodium', 'zinc', 'copper', 'manganese', 'selenium', 'chromium', 'iodine',
];

function flattenFood(food: Food) {
  const micros: Record<string, number> = {};
  MICRO_KEYS.forEach((key) => {
    micros[key] = food.micros[key] ?? 0;
  });
  return {
    name: food.name,
    ...(food.brand ? { brand: food.brand } : {}),
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    category: food.category,
    ...(food.image ? { image: food.image } : {}),
    calories: food.macros.calories,
    protein: food.macros.protein,
    carbohydrates: food.macros.carbohydrates,
    fat: food.macros.fat,
    fiber: food.macros.fiber,
    sugar: food.macros.sugar,
    ...micros,
  };
}

function inflateFood(flat: any): Food {
  const micros = {} as Micronutrients;
  MICRO_KEYS.forEach((key) => {
    micros[key] = Number(flat[key] ?? 0);
  });
  return {
    id: flat.id,
    name: flat.name,
    brand: flat.brand ?? undefined,
    servingSize: Number(flat.servingSize),
    servingUnit: flat.servingUnit,
    category: flat.category,
    image: flat.image ?? undefined,
    macros: {
      calories: Number(flat.calories),
      protein: Number(flat.protein),
      carbohydrates: Number(flat.carbohydrates),
      fat: Number(flat.fat),
      fiber: Number(flat.fiber ?? 0),
      sugar: Number(flat.sugar ?? 0),
    },
    micros,
  };
}

function inflateSavedMeal(raw: any): SavedMeal {
  return {
    id: raw.id,
    userId: raw.userId,
    name: raw.name,
    createdAt: raw.createdAt,
    items: (raw.items ?? []).map((item: any) => ({
      servings: Number(item.servings),
      food: inflateFood(item.food),
    })),
  };
}

export async function listSavedMeals(userId: string): Promise<SavedMeal[]> {
  const res = await fetch(`${BACKEND_URL}/api/saved-meals?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    log.warn('savedMeals.list.http_error', { status: res.status });
    throw new Error(`Failed to load saved meals (${res.status})`);
  }
  const data = await res.json();
  return (data.savedMeals ?? []).map(inflateSavedMeal);
}

export async function createSavedMeal(
  userId: string,
  name: string,
  items: { servings: number; food: Food }[]
): Promise<SavedMeal> {
  const res = await fetch(`${BACKEND_URL}/api/saved-meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      name,
      items: items.map((item) => ({
        servings: item.servings,
        food: flattenFood(item.food),
      })),
    }),
  });
  if (!res.ok) {
    log.warn('savedMeals.create.http_error', { status: res.status });
    throw new Error(`Failed to save meal (${res.status})`);
  }
  const data = await res.json();
  return inflateSavedMeal(data.savedMeal);
}

export async function deleteSavedMeal(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/saved-meals/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    log.warn('savedMeals.delete.http_error', { status: res.status });
    throw new Error(`Failed to delete saved meal (${res.status})`);
  }
}

import { FoodLogEntry, Micronutrients } from '../types/nutrition';

import { BACKEND_URL } from '@/lib/config';

export function calculateNutrientScore(
  entries: FoodLogEntry[],
  goals: Micronutrients
): { score: number; micronutrients: Record<string, number> } {
  const micros: Micronutrients = {
    vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
    vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
    vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
    phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
    selenium: 0, chromium: 0, iodine: 0,
  };

  entries.forEach(entry => {
    (Object.keys(micros) as (keyof Micronutrients)[]).forEach(k => {
      micros[k] += (entry.food.micros[k] ?? 0) * entry.servings;
    });
  });

  let total = 0;
  let count = 0;
  const coverage: Record<string, number> = {};

  (Object.keys(micros) as (keyof Micronutrients)[]).forEach(k => {
    const goal = goals[k];
    if (goal > 0) {
      const pct = Math.min((micros[k] / goal) * 100, 100);
      coverage[k] = pct;
      total += pct;
      count++;
    }
  });

  return {
    score: count > 0 ? Math.round(total / count) : 0,
    micronutrients: coverage,
  };
}

// Fire-and-forget — does not block UI
export function syncNutrientScore(
  userId: string,
  date: string,
  entries: FoodLogEntry[],
  goals: Micronutrients
): void {
  if (!userId) return;
  const { score, micronutrients } = calculateNutrientScore(entries, goals);
  fetch(`${BACKEND_URL}/api/nutrient-score/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, date, score, micronutrients: JSON.stringify(micronutrients) }),
  }).catch(() => {});
}

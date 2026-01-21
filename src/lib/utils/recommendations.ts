import { Food, Macronutrients, Micronutrients } from '../types/nutrition';
import { FOOD_DATABASE } from '../data/foods';

interface Recommendation {
  food: Food;
  score: number;
  reasons: string[];
}

// Recommend foods based on remaining calories and macro balance
export function getSmartRecommendations(
  remainingCalories: number,
  remainingMacros: Macronutrients,
  remainingMicros: Micronutrients,
  count: number = 5
): Recommendation[] {
  if (remainingCalories <= 0) return [];

  const recommendations: Recommendation[] = [];

  // Determine the dominant remaining macro need (as percentage of goal)
  const macroPriority = getMacroPriority(remainingMacros);
  const microDeficiencies = getMicroDeficiencies(remainingMicros);

  FOOD_DATABASE.forEach(food => {
    const { macros, micros } = food;

    // Skip if food exceeds remaining calories significantly
    if (macros.calories > remainingCalories * 1.5) return;

    let score = 0;
    const reasons: string[] = [];

    // Score based on calorie fit (prefer foods that fit well within budget)
    const calorieFitScore = 1 - Math.abs(macros.calories - remainingCalories * 0.3) / (remainingCalories || 1);
    score += Math.max(0, calorieFitScore) * 20;

    // Score based on macro alignment
    if (macroPriority === 'carbohydrates' && macros.carbohydrates > macros.protein && macros.carbohydrates > macros.fat) {
      score += 25;
      reasons.push('Good source of carbs');
    } else if (macroPriority === 'protein' && macros.protein > 5) {
      score += 25 + (macros.protein / macros.calories) * 50; // Bonus for protein density
      reasons.push('High in protein');
    } else if (macroPriority === 'fat' && macros.fat > macros.carbohydrates / 3) {
      score += 20;
      reasons.push('Contains healthy fats');
    }

    // Score based on micronutrient deficiencies being addressed
    microDeficiencies.forEach(({ key, name, percentMissing }) => {
      const microValue = micros[key as keyof Micronutrients];
      if (microValue > 0) {
        const contribution = microValue / remainingMicros[key as keyof Micronutrients];
        if (contribution > 0.1) {
          score += contribution * 15;
          if (contribution > 0.2) {
            reasons.push(`Rich in ${name}`);
          }
        }
      }
    });

    // Fiber bonus
    if (macros.fiber > 3 && remainingMacros.fiber > 5) {
      score += 10;
      reasons.push('Good fiber source');
    }

    // Penalize high sugar if remaining sugar budget is low
    if (macros.sugar > 10 && remainingMacros.sugar < 15) {
      score -= 15;
    }

    if (score > 10 && reasons.length > 0) {
      recommendations.push({ food, score, reasons: [...new Set(reasons)].slice(0, 3) });
    }
  });

  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// Determine which macro is most needed
function getMacroPriority(remaining: Macronutrients): 'protein' | 'carbohydrates' | 'fat' {
  // Calculate percentage of calories from each macro
  const proteinCals = remaining.protein * 4;
  const carbCals = remaining.carbohydrates * 4;
  const fatCals = remaining.fat * 9;
  const totalCals = remaining.calories || 1;

  // Typical balanced ratio: 50% carbs, 25% protein, 25% fat
  const carbRatio = carbCals / totalCals;
  const proteinRatio = proteinCals / totalCals;
  const fatRatio = fatCals / totalCals;

  if (carbRatio > 0.4) return 'carbohydrates';
  if (proteinRatio > 0.25) return 'protein';
  if (fatRatio > 0.25) return 'fat';

  // Default to carbs as they're typically the largest macro need
  return 'carbohydrates';
}

// Get top micronutrient deficiencies
function getMicroDeficiencies(remaining: Micronutrients): Array<{ key: string; name: string; percentMissing: number }> {
  const deficiencies: Array<{ key: string; name: string; percentMissing: number }> = [];

  const microNames: Record<string, string> = {
    vitaminA: 'Vitamin A',
    vitaminB1: 'B1 (Thiamin)',
    vitaminB2: 'B2 (Riboflavin)',
    vitaminB3: 'B3 (Niacin)',
    vitaminB5: 'B5',
    vitaminB6: 'Vitamin B6',
    vitaminB7: 'B7 (Biotin)',
    vitaminB9: 'Folate',
    vitaminB12: 'Vitamin B12',
    vitaminC: 'Vitamin C',
    vitaminD: 'Vitamin D',
    vitaminE: 'Vitamin E',
    vitaminK: 'Vitamin K',
    calcium: 'Calcium',
    iron: 'Iron',
    magnesium: 'Magnesium',
    phosphorus: 'Phosphorus',
    potassium: 'Potassium',
    zinc: 'Zinc',
    selenium: 'Selenium',
  };

  (Object.keys(remaining) as (keyof Micronutrients)[]).forEach(key => {
    const value = remaining[key];
    if (value > 0 && microNames[key]) {
      deficiencies.push({
        key,
        name: microNames[key],
        percentMissing: value,
      });
    }
  });

  // Return top deficiencies
  return deficiencies.slice(0, 10);
}

// Get quick snack suggestions based on calorie budget
export function getQuickSnacks(remainingCalories: number): Food[] {
  if (remainingCalories <= 0) return [];

  return FOOD_DATABASE
    .filter(food => food.macros.calories <= remainingCalories && food.macros.calories <= 200)
    .sort((a, b) => {
      // Prefer nutrient-dense, lower sugar options
      const scoreA = (a.macros.fiber + a.macros.protein) / a.macros.calories - a.macros.sugar / 20;
      const scoreB = (b.macros.fiber + b.macros.protein) / b.macros.calories - b.macros.sugar / 20;
      return scoreB - scoreA;
    })
    .slice(0, 6);
}

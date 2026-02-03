import { Food, Macronutrients, Micronutrients, DAILY_VALUES } from '../types/nutrition';
import { FOOD_DATABASE } from '../data/foods';

interface Recommendation {
  food: Food;
  score: number;
  reasons: string[];
}

// Recommend foods based on remaining calories and PRIORITIZING micronutrient deficiencies
export function getSmartRecommendations(
  remainingCalories: number,
  remainingMacros: Macronutrients,
  remainingMicros: Micronutrients,
  count: number = 5
): Recommendation[] {
  if (remainingCalories <= 0) return [];

  const recommendations: Recommendation[] = [];

  // Get micronutrient deficiencies sorted by severity
  const microDeficiencies = getMicroDeficiencies(remainingMicros);
  const macroPriority = getMacroPriority(remainingMacros);

  FOOD_DATABASE.forEach(food => {
    const { macros, micros } = food;

    // Skip if food exceeds remaining calories significantly
    if (macros.calories > remainingCalories * 1.5) return;

    let score = 0;
    const reasons: string[] = [];

    // PRIORITY 1: Score based on micronutrient deficiencies (highest weight)
    let microScore = 0;
    const microContributions: string[] = [];

    microDeficiencies.forEach(({ key, name, percentMissing, dailyValue }) => {
      const microValue = micros[key as keyof Micronutrients];
      if (microValue > 0 && dailyValue > 0) {
        // Calculate what percentage of daily value this food provides
        const percentOfDV = (microValue / dailyValue) * 100;

        // Higher score for nutrients you're missing the most
        if (percentOfDV >= 10) {
          const deficiencyWeight = Math.min(percentMissing / 100, 1); // How much you're missing
          microScore += percentOfDV * deficiencyWeight * 2;

          if (percentOfDV >= 20) {
            microContributions.push(`${Math.round(percentOfDV)}% ${name}`);
          }
        }
      }
    });

    // Add top micronutrient contributions to reasons
    if (microContributions.length > 0) {
      const topMicros = microContributions.slice(0, 2);
      reasons.push(`Rich in ${topMicros.join(', ')}`);
    }

    score += microScore;

    // PRIORITY 2: Score based on calorie fit (moderate weight)
    const calorieFitScore = 1 - Math.abs(macros.calories - remainingCalories * 0.25) / (remainingCalories || 1);
    score += Math.max(0, calorieFitScore) * 15;

    // PRIORITY 3: Score based on macro alignment (lower weight)
    if (macroPriority === 'protein' && macros.protein > 5) {
      const proteinDensity = (macros.protein / macros.calories) * 100;
      score += 10 + proteinDensity * 2;
      if (proteinDensity > 0.15) {
        reasons.push('High protein');
      }
    } else if (macroPriority === 'carbohydrates' && macros.carbohydrates > macros.protein) {
      score += 8;
    } else if (macroPriority === 'fat' && macros.fat > 3) {
      score += 8;
      if (!reasons.includes('Contains healthy fats')) {
        reasons.push('Contains healthy fats');
      }
    }

    // Fiber bonus - important for gut health
    if (macros.fiber > 3 && remainingMacros.fiber > 5) {
      score += 12;
      if (macros.fiber >= 5) {
        reasons.push('Good fiber');
      }
    }

    // Penalize high sugar if remaining sugar budget is low
    if (macros.sugar > 10 && remainingMacros.sugar < 15) {
      score -= 20;
    }

    // Penalize high sodium
    if (micros.sodium > 400) {
      score -= 10;
    }

    // Bonus for nutrient density (micronutrients per calorie)
    const nutrientDensity = calculateNutrientDensity(food);
    score += nutrientDensity * 20;

    if (nutrientDensity > 0.5 && !reasons.find(r => r.includes('Rich'))) {
      reasons.push('Nutrient dense');
    }

    if (score > 15 && reasons.length > 0) {
      recommendations.push({ food, score, reasons: [...new Set(reasons)].slice(0, 3) });
    }
  });

  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// Calculate nutrient density score (how nutrient-rich relative to calories)
function calculateNutrientDensity(food: Food): number {
  const { macros, micros } = food;
  if (macros.calories === 0) return 0;

  let densityScore = 0;
  const dv = DAILY_VALUES.micros;

  // Score key nutrients
  const keyNutrients: (keyof Micronutrients)[] = [
    'vitaminA', 'vitaminC', 'vitaminD', 'vitaminK', 'vitaminB12',
    'vitaminB9', 'calcium', 'iron', 'magnesium', 'potassium', 'zinc'
  ];

  keyNutrients.forEach(key => {
    if (micros[key] > 0 && dv[key] > 0) {
      const percentDV = micros[key] / dv[key];
      densityScore += percentDV;
    }
  });

  // Normalize by calories (per 100 cal)
  return (densityScore / macros.calories) * 100;
}

// Determine which macro is most needed
function getMacroPriority(remaining: Macronutrients): 'protein' | 'carbohydrates' | 'fat' {
  const proteinCals = remaining.protein * 4;
  const carbCals = remaining.carbohydrates * 4;
  const fatCals = remaining.fat * 9;
  const totalCals = remaining.calories || 1;

  const carbRatio = carbCals / totalCals;
  const proteinRatio = proteinCals / totalCals;
  const fatRatio = fatCals / totalCals;

  if (carbRatio > 0.4) return 'carbohydrates';
  if (proteinRatio > 0.25) return 'protein';
  if (fatRatio > 0.25) return 'fat';

  return 'carbohydrates';
}

// Get top micronutrient deficiencies with daily value context
function getMicroDeficiencies(remaining: Micronutrients): Array<{
  key: string;
  name: string;
  percentMissing: number;
  dailyValue: number;
}> {
  const deficiencies: Array<{ key: string; name: string; percentMissing: number; dailyValue: number }> = [];
  const dv = DAILY_VALUES.micros;

  const microNames: Record<string, string> = {
    vitaminA: 'Vitamin A',
    vitaminB1: 'B1',
    vitaminB2: 'B2',
    vitaminB3: 'B3',
    vitaminB5: 'B5',
    vitaminB6: 'B6',
    vitaminB7: 'Biotin',
    vitaminB9: 'Folate',
    vitaminB12: 'B12',
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
    iodine: 'Iodine',
  };

  (Object.keys(remaining) as (keyof Micronutrients)[]).forEach(key => {
    const value = remaining[key];
    const dailyValue = dv[key];
    if (value > 0 && microNames[key] && dailyValue > 0) {
      // Calculate what percentage of daily value is still needed
      const percentMissing = (value / dailyValue) * 100;
      deficiencies.push({
        key,
        name: microNames[key],
        percentMissing,
        dailyValue,
      });
    }
  });

  // Sort by percentage missing (highest first = most deficient)
  return deficiencies
    .sort((a, b) => b.percentMissing - a.percentMissing)
    .slice(0, 10);
}

// Get quick snack suggestions based on calorie budget
export function getQuickSnacks(remainingCalories: number): Food[] {
  if (remainingCalories <= 0) return [];

  return FOOD_DATABASE
    .filter(food => food.macros.calories <= remainingCalories && food.macros.calories <= 200)
    .sort((a, b) => {
      // Prefer nutrient-dense, lower sugar options
      const densityA = calculateNutrientDensity(a);
      const densityB = calculateNutrientDensity(b);
      const scoreA = densityA + (a.macros.fiber + a.macros.protein) / a.macros.calories - a.macros.sugar / 30;
      const scoreB = densityB + (b.macros.fiber + b.macros.protein) / b.macros.calories - b.macros.sugar / 30;
      return scoreB - scoreA;
    })
    .slice(0, 6);
}

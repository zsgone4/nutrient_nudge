import { Hono } from "hono";
import { db } from "../db";

const goalsRouter = new Hono();

// Constants from mobile app
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  aggressive_cut: -0.25,
  conservative_cut: -0.125,
  maintain: 0,
  conservative_bulk: 0.125,
  aggressive_bulk: 0.25,
};

const DAILY_VALUES: Record<string, number> = {
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
  calcium: 1200,
  iron: 18,
  magnesium: 420,
  phosphorus: 1000,
  potassium: 3500,
  sodium: 2300,
  zinc: 11,
  copper: 0.9,
  manganese: 2.3,
  selenium: 55,
  chromium: 35,
  iodine: 150,
};

// Calculate BMR using Mifflin-St Jeor equation
function calculateBMR(profile: any): number {
  const { weightKg, heightCm, age, sex } = profile.userProfile || profile;
  const userAge = profile.age || 30; // fallback to signup age

  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * userAge + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * userAge - 161;
  }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(profile: any): number {
  const bmr = calculateBMR(profile);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[profile.userProfile?.activityLevel || "moderate"] ?? 1.55;
  return Math.round(bmr * activityMultiplier);
}

// Calculate target calories based on goal
function calculateTargetCalories(profile: any): number {
  const tdee = calculateTDEE(profile);
  const adjustment = GOAL_ADJUSTMENTS[profile.userProfile?.goal || "maintain"] ?? 0;
  return Math.round(tdee * (1 + adjustment));
}

// Calculate macro targets
function calculateMacros(calories: number, weightKg: number) {
  // Protein: 1.8g per kg body weight
  const proteinGrams = Math.round(weightKg * 1.8);
  const proteinCalories = proteinGrams * 4;

  // Fat: 27% of calories
  const fatCalories = calories * 0.27;
  const fatGrams = Math.round(fatCalories / 9);

  // Carbs: remaining calories
  const carbCalories = calories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);

  // Fiber: 14g per 1000 calories
  const fiber = Math.round((calories / 1000) * 14);

  // Sugar: less than 10% of calories (8% target)
  const sugar = Math.round((calories * 0.08) / 4);

  return {
    calories,
    protein: proteinGrams,
    carbohydrates: carbGrams,
    fat: fatGrams,
    fiber,
    sugar,
  };
}

// GET /api/goals/:userId - Get daily nutrition goals for a user
goalsRouter.get("/:userId", async (c) => {
  const userId = c.req.param("userId");

  // Get user data
  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get user profile
  const userProfile = await db.userProfile.findUnique({ where: { userId } });
  if (!userProfile) {
    return c.json({ error: "User profile not found. Please complete profile setup." }, 404);
  }

  // Combine user and profile data
  const profileData = { ...user, userProfile };

  // Calculate goals
  const tdee = calculateTDEE(profileData);
  const targetCalories = calculateTargetCalories(profileData);
  const macros = calculateMacros(targetCalories, userProfile.weightKg);

  // Build micronutrients goals (simplified - can be expanded)
  const micros = {
    vitaminA: DAILY_VALUES.vitaminA,
    vitaminB1: DAILY_VALUES.vitaminB1,
    vitaminB2: DAILY_VALUES.vitaminB2,
    vitaminB3: DAILY_VALUES.vitaminB3,
    vitaminB5: DAILY_VALUES.vitaminB5,
    vitaminB6: DAILY_VALUES.vitaminB6,
    vitaminB7: DAILY_VALUES.vitaminB7,
    vitaminB9: DAILY_VALUES.vitaminB9,
    vitaminB12: DAILY_VALUES.vitaminB12,
    vitaminC: DAILY_VALUES.vitaminC,
    vitaminD: DAILY_VALUES.vitaminD,
    vitaminE: DAILY_VALUES.vitaminE,
    vitaminK: DAILY_VALUES.vitaminK,
    calcium: DAILY_VALUES.calcium,
    iron: DAILY_VALUES.iron,
    magnesium: DAILY_VALUES.magnesium,
    phosphorus: DAILY_VALUES.phosphorus,
    potassium: DAILY_VALUES.potassium,
    sodium: DAILY_VALUES.sodium,
    zinc: DAILY_VALUES.zinc,
    copper: DAILY_VALUES.copper,
    manganese: DAILY_VALUES.manganese,
    selenium: DAILY_VALUES.selenium,
    chromium: DAILY_VALUES.chromium,
    iodine: DAILY_VALUES.iodine,
  };

  return c.json({
    userId,
    bmr: Math.round(calculateBMR(profileData)),
    tdee,
    activityMultiplier: ACTIVITY_MULTIPLIERS[userProfile.activityLevel],
    goal: userProfile.goal,
    goalAdjustment: GOAL_ADJUSTMENTS[userProfile.goal],
    dailyGoals: {
      macros,
      micros,
    },
  });
});

export { goalsRouter };

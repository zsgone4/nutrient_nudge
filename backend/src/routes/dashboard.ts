import { Hono } from "hono";
import { db } from "../db";

const dashboardRouter = new Hono();

// GET /api/dashboard/users - Get all users with aggregated data
dashboardRouter.get("/users", async (c) => {
  const users = await db.signup.findMany({
    include: {
      userProfile: true,
      foodLogEntries: {
        select: {
          id: true,
          date: true,
        },
      },
      nutrientScores: {
        orderBy: { date: "desc" },
        take: 1, // Get latest score
      },
    },
  });

  // Transform data for dashboard
  const dashboardUsers = users.map((user) => {
    const goals = JSON.parse(user.goals || "[]");
    const latestScore = user.nutrientScores[0];
    const micronutrients = latestScore
      ? JSON.parse(latestScore.micronutrients)
      : null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      goals,
      trainingGoal: user.trainingGoal,
      profile: user.userProfile
        ? {
            height: user.userProfile.heightCm,
            weight: user.userProfile.weightKg,
            sex: user.userProfile.sex,
            activityLevel: user.userProfile.activityLevel,
            goal: user.userProfile.goal,
            isSetup: user.userProfile.isSetup,
          }
        : null,
      foodEntries: {
        total: user.foodLogEntries.length,
        dates: [
          ...new Set(user.foodLogEntries.map((entry) => entry.date)),
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
      },
      latestNutrientScore: latestScore
        ? {
            date: latestScore.date,
            score: latestScore.score,
            micronutrients,
          }
        : null,
      joinedAt: user.createdAt,
    };
  });

  return c.json({
    totalUsers: dashboardUsers.length,
    users: dashboardUsers,
  });
});

// GET /api/dashboard/users/:userId - Get detailed user data
dashboardRouter.get("/users/:userId", async (c) => {
  const userId = c.req.param("userId");

  const user = await db.signup.findUnique({
    where: { id: userId },
    include: {
      userProfile: true,
      foodLogEntries: {
        include: { food: true },
        orderBy: { timestamp: "desc" },
      },
      nutrientScores: {
        orderBy: { date: "desc" },
        take: 30, // Last 30 days of scores
      },
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const goals = JSON.parse(user.goals || "[]");

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      goals,
      trainingGoal: user.trainingGoal,
      joinedAt: user.createdAt,
      profile: user.userProfile
        ? {
            height: user.userProfile.heightCm,
            weight: user.userProfile.weightKg,
            sex: user.userProfile.sex,
            activityLevel: user.userProfile.activityLevel,
            goal: user.userProfile.goal,
            isSetup: user.userProfile.isSetup,
            createdAt: user.userProfile.createdAt,
          }
        : null,
      foodEntries: user.foodLogEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        mealType: entry.mealType,
        servings: entry.servings,
        food: {
          id: entry.food.id,
          name: entry.food.name,
          brand: entry.food.brand,
          category: entry.food.category,
          calories: entry.food.calories,
          protein: entry.food.protein,
          carbohydrates: entry.food.carbohydrates,
          fat: entry.food.fat,
        },
      })),
      nutrientScoreHistory: user.nutrientScores.map((score) => ({
        date: score.date,
        score: score.score,
        micronutrients: JSON.parse(score.micronutrients),
      })),
    },
  });
});

// GET /api/dashboard/stats - Get overall business stats
dashboardRouter.get("/stats", async (c) => {
  const totalUsers = await db.signup.count();
  const usersWithProfile = await db.userProfile.count();
  const totalFoodEntries = await db.foodLogEntry.count();
  const totalFoodsInDatabase = await db.food.count();
  const totalNutrientScores = await db.nutrientScore.count();

  // Get users by goal
  const usersByGoal: Record<string, number> = {};
  const profiles = await db.userProfile.findMany();
  profiles.forEach((p) => {
    usersByGoal[p.goal] = (usersByGoal[p.goal] || 0) + 1;
  });

  // Get average nutrient score
  const scores = await db.nutrientScore.findMany({
    select: { score: true },
  });
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
      : 0;

  return c.json({
    stats: {
      totalUsers,
      usersWithCompleteProfile: usersWithProfile,
      totalFoodEntries,
      totalFoodsInDatabase,
      totalNutrientScores,
      averageNutrientScore: averageScore,
      usersByGoal,
    },
  });
});

export { dashboardRouter };

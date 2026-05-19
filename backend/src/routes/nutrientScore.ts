import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";

const nutrientScoreRouter = new Hono();

// Daily Reference Values for micronutrients
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

// Micronutrient list in order
const MICRONUTRIENTS = Object.keys(DAILY_VALUES);

// POST /api/nutrient-score/calculate - Calculate and save nutrient score for a user on a given date
nutrientScoreRouter.post(
  "/calculate",
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    })
  ),
  async (c) => {
    const { userId, date } = c.req.valid("json");

    // Verify user exists
    const user = await db.signup.findUnique({ where: { id: userId } });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get all food log entries for this user on this date
    const entries = await db.foodLogEntry.findMany({
      where: { userId, date },
      include: { food: true },
    });

    // Aggregate micronutrients
    const aggregated: Record<string, number> = {};
    MICRONUTRIENTS.forEach((nutrient) => {
      aggregated[nutrient] = 0;
    });

    entries.forEach((entry) => {
      const food = entry.food;
      const servingMultiplier = entry.servings;

      // Add nutrients based on servings
      MICRONUTRIENTS.forEach((nutrient) => {
        const fieldName = nutrient as keyof typeof food;
        const value = (food[fieldName] as number) || 0;
        aggregated[nutrient] = (aggregated[nutrient] ?? 0) + value * servingMultiplier;
      });
    });

    // Calculate coverage percentage for each nutrient
    const coverage: Record<string, number> = {};
    let totalCoverage = 0;

    MICRONUTRIENTS.forEach((nutrient) => {
      const dv: number = DAILY_VALUES[nutrient] ?? 0;
      const consumed: number = aggregated[nutrient] ?? 0;
      const percentageCoverage = dv > 0 ? Math.min((consumed / dv) * 100, 100) : 0;
      coverage[nutrient] = percentageCoverage;
      totalCoverage += percentageCoverage;
    });

    // Calculate overall score (0-100)
    const score = Math.round(totalCoverage / MICRONUTRIENTS.length);

    // Check if score already exists for this date
    const existing = await db.nutrientScore.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (existing) {
      // Update existing score
      const updated = await db.nutrientScore.update({
        where: { id: existing.id },
        data: {
          score,
          micronutrients: JSON.stringify(coverage),
        },
      });
      return c.json({ success: true, nutrientScore: updated }, 200);
    }

    // Create new score
    const nutrientScore = await db.nutrientScore.create({
      data: {
        userId,
        date,
        score,
        micronutrients: JSON.stringify(coverage),
      },
    });

    return c.json({ success: true, nutrientScore }, 201);
  }
);

// GET /api/nutrient-score/history/:userId - Get nutrient score history for a user
nutrientScoreRouter.get("/history/:userId", async (c) => {
  const userId = c.req.param("userId");
  const limit = Number(c.req.query("limit")) || 30;

  const scores = await db.nutrientScore.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });

  return c.json({
    scores: scores.map((s) => ({
      ...s,
      micronutrients: JSON.parse(s.micronutrients),
    })),
  });
});

// GET /api/nutrient-score/:userId/:date - Get nutrient score for a specific date
nutrientScoreRouter.get("/:userId/:date", async (c) => {
  const userId = c.req.param("userId");
  const date = c.req.param("date");

  const nutrientScore = await db.nutrientScore.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!nutrientScore) {
    return c.json({ error: "Nutrient score not found for this date" }, 404);
  }

  return c.json({
    nutrientScore: {
      ...nutrientScore,
      micronutrients: JSON.parse(nutrientScore.micronutrients),
    },
  });
});

// POST /api/nutrient-score/upsert - Save a pre-calculated score from the client
nutrientScoreRouter.post(
  "/upsert",
  zValidator(
    "json",
    z.object({
      userId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      score: z.number().min(0).max(100),
      micronutrients: z.string(),
    })
  ),
  async (c) => {
    const { userId, date, score, micronutrients } = c.req.valid("json");

    const user = await db.signup.findUnique({ where: { id: userId } });
    if (!user) return c.json({ error: "User not found" }, 404);

    const result = await db.nutrientScore.upsert({
      where: { userId_date: { userId, date } },
      update: { score, micronutrients },
      create: { userId, date, score, micronutrients },
    });

    return c.json({ success: true, nutrientScore: result });
  }
);

export { nutrientScoreRouter };

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";

const foodLogsRouter = new Hono();

// POST /api/food-logs - Create a new food log entry
const createLogSchema = z.object({
  userId: z.string().min(1),
  foodId: z.string().min(1),
  servings: z.number().positive(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  timestamp: z.number(),
});

foodLogsRouter.post("/", zValidator("json", createLogSchema), async (c) => {
  const { userId, foodId, servings, mealType, date, timestamp } = c.req.valid("json");

  // Verify user exists
  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Verify food exists
  const food = await db.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return c.json({ error: "Food not found" }, 404);
  }

  const logEntry = await db.foodLogEntry.create({
    data: {
      userId,
      foodId,
      servings,
      mealType,
      date,
      timestamp,
    },
    include: {
      food: true,
    },
  });

  return c.json({ success: true, logEntry }, 201);
});

// GET /api/food-logs - Get food log entries for a specific date
foodLogsRouter.get("/", async (c) => {
  const userId = c.req.query("userId");
  const date = c.req.query("date"); // YYYY-MM-DD format

  if (!userId) {
    return c.json({ error: "userId is required" }, 400);
  }

  if (!date) {
    return c.json({ error: "date is required (format: YYYY-MM-DD)" }, 400);
  }

  // Verify user exists
  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const entries = await db.foodLogEntry.findMany({
    where: {
      userId,
      date,
    },
    include: {
      food: true,
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  // Calculate daily totals
  const totals = entries.reduce(
    (acc, entry) => {
      const multiplier = entry.servings;
      return {
        calories: acc.calories + entry.food.calories * multiplier,
        protein: acc.protein + entry.food.protein * multiplier,
        carbohydrates: acc.carbohydrates + entry.food.carbohydrates * multiplier,
        fat: acc.fat + entry.food.fat * multiplier,
        fiber: acc.fiber + entry.food.fiber * multiplier,
        sugar: acc.sugar + entry.food.sugar * multiplier,
      };
    },
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  return c.json({
    entries,
    totals,
    date,
  });
});

// GET /api/food-logs/user/:userId - Get food log entries for a date range
foodLogsRouter.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const startDate = c.req.query("startDate"); // YYYY-MM-DD
  const endDate = c.req.query("endDate"); // YYYY-MM-DD

  // Verify user exists
  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const whereClause: any = { userId };

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    whereClause.date = { gte: startDate };
  } else if (endDate) {
    whereClause.date = { lte: endDate };
  }

  const entries = await db.foodLogEntry.findMany({
    where: whereClause,
    include: {
      food: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Group by date and calculate daily totals
  const dailyTotals: Record<
    string,
    {
      date: string;
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      sugar: number;
    }
  > = {};

  entries.forEach((entry) => {
    if (!dailyTotals[entry.date]) {
      dailyTotals[entry.date] = {
        date: entry.date,
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      };
    }

    const multiplier = entry.servings;
    const day = dailyTotals[entry.date]!;
    day.calories += entry.food.calories * multiplier;
    day.protein += entry.food.protein * multiplier;
    day.carbohydrates += entry.food.carbohydrates * multiplier;
    day.fat += entry.food.fat * multiplier;
    day.fiber += entry.food.fiber * multiplier;
    day.sugar += entry.food.sugar * multiplier;
  });

  return c.json({
    entries,
    dailyTotals: Object.values(dailyTotals).sort((a, b) => b.date.localeCompare(a.date)),
  });
});

// DELETE /api/food-logs/:id - Delete a food log entry
foodLogsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await db.foodLogEntry.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Food log entry not found" }, 404);
  }

  await db.foodLogEntry.delete({ where: { id } });

  return c.json({ success: true });
});

export { foodLogsRouter };

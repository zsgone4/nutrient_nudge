import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";

const foodsRouter = new Hono();

// GET /api/foods - Get all foods with optional pagination
foodsRouter.get("/", async (c) => {
  const skip = Number(c.req.query("skip")) || 0;
  const take = Math.min(Number(c.req.query("take")) || 50, 100); // Max 100 per request

  const foods = await db.food.findMany({
    skip,
    take,
    select: {
      id: true,
      name: true,
      brand: true,
      servingSize: true,
      servingUnit: true,
      category: true,
      image: true,
      calories: true,
      protein: true,
      carbohydrates: true,
      fat: true,
      fiber: true,
    },
  });

  const total = await db.food.count();

  return c.json({
    foods,
    pagination: { skip, take, total },
  });
});

// GET /api/foods/search - Search foods by name or category
foodsRouter.get("/search", async (c) => {
  const query = c.req.query("q") || "";
  const category = c.req.query("category");

  if (!query && !category) {
    return c.json({ error: "Please provide a search query or category" }, 400);
  }

  const foods = await db.food.findMany({
    where: {
      ...(query && {
        OR: [
          { name: { contains: query } },
          { brand: { contains: query } },
        ],
      }),
      ...(category && { category }),
    },
    take: 50,
    select: {
      id: true,
      name: true,
      brand: true,
      servingSize: true,
      servingUnit: true,
      category: true,
      image: true,
      calories: true,
      protein: true,
      carbohydrates: true,
      fat: true,
      fiber: true,
    },
  });

  return c.json({ foods });
});

// GET /api/foods/:id - Get single food by ID
foodsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const food = await db.food.findUnique({
    where: { id },
  });

  if (!food) {
    return c.json({ error: "Food not found" }, 404);
  }

  // Convert all numeric fields to ensure they're numbers
  return c.json({
    food: {
      ...food,
      servingSize: Number(food.servingSize),
      calories: Number(food.calories),
      protein: Number(food.protein),
      carbohydrates: Number(food.carbohydrates),
      fat: Number(food.fat),
      fiber: Number(food.fiber),
      sugar: Number(food.sugar),
      vitaminA: Number(food.vitaminA),
      vitaminB1: Number(food.vitaminB1),
      vitaminB2: Number(food.vitaminB2),
      vitaminB3: Number(food.vitaminB3),
      vitaminB5: Number(food.vitaminB5),
      vitaminB6: Number(food.vitaminB6),
      vitaminB7: Number(food.vitaminB7),
      vitaminB9: Number(food.vitaminB9),
      vitaminB12: Number(food.vitaminB12),
      vitaminC: Number(food.vitaminC),
      vitaminD: Number(food.vitaminD),
      vitaminE: Number(food.vitaminE),
      vitaminK: Number(food.vitaminK),
      calcium: Number(food.calcium),
      iron: Number(food.iron),
      magnesium: Number(food.magnesium),
      phosphorus: Number(food.phosphorus),
      potassium: Number(food.potassium),
      sodium: Number(food.sodium),
      zinc: Number(food.zinc),
      copper: Number(food.copper),
      manganese: Number(food.manganese),
      selenium: Number(food.selenium),
      chromium: Number(food.chromium),
      iodine: Number(food.iodine),
    },
  });
});

// POST /api/foods - Create a new food (admin only in production)
const foodSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string(),
  category: z.string(),
  image: z.string().url().optional(),
  // Macros
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbohydrates: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  sugar: z.number().min(0),
  // Micros
  vitaminA: z.number().min(0).default(0),
  vitaminB1: z.number().min(0).default(0),
  vitaminB2: z.number().min(0).default(0),
  vitaminB3: z.number().min(0).default(0),
  vitaminB5: z.number().min(0).default(0),
  vitaminB6: z.number().min(0).default(0),
  vitaminB7: z.number().min(0).default(0),
  vitaminB9: z.number().min(0).default(0),
  vitaminB12: z.number().min(0).default(0),
  vitaminC: z.number().min(0).default(0),
  vitaminD: z.number().min(0).default(0),
  vitaminE: z.number().min(0).default(0),
  vitaminK: z.number().min(0).default(0),
  calcium: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
  magnesium: z.number().min(0).default(0),
  phosphorus: z.number().min(0).default(0),
  potassium: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  zinc: z.number().min(0).default(0),
  copper: z.number().min(0).default(0),
  manganese: z.number().min(0).default(0),
  selenium: z.number().min(0).default(0),
  chromium: z.number().min(0).default(0),
  iodine: z.number().min(0).default(0),
});

foodsRouter.post("/", zValidator("json", foodSchema), async (c) => {
  const data = c.req.valid("json");

  const food = await db.food.create({
    data,
  });

  return c.json({ success: true, food }, 201);
});

export { foodsRouter };

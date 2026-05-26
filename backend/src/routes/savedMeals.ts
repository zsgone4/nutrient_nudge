import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";

const savedMealsRouter = new Hono();

const foodPayloadSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string(),
  category: z.string(),
  image: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbohydrates: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  sugar: z.number().min(0),
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

const createSavedMealSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  items: z
    .array(
      z.object({
        servings: z.number().positive(),
        food: foodPayloadSchema,
      })
    )
    .min(1),
});

async function findOrCreateFood(food: z.infer<typeof foodPayloadSchema>) {
  const existing = await db.food.findFirst({
    where: {
      name: food.name,
      brand: food.brand ?? null,
      servingSize: food.servingSize,
      calories: food.calories,
    },
  });
  if (existing) return existing;
  return db.food.create({ data: food });
}

function serializeSavedMeal(meal: {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  items: { id: string; servings: number; food: any }[];
}) {
  return {
    id: meal.id,
    userId: meal.userId,
    name: meal.name,
    createdAt: meal.createdAt,
    items: meal.items
      .filter((item) => item.food)
      .map((item) => ({
      id: item.id,
      servings: item.servings,
      food: {
        ...item.food,
        servingSize: Number(item.food.servingSize),
        calories: Number(item.food.calories),
        protein: Number(item.food.protein),
        carbohydrates: Number(item.food.carbohydrates),
        fat: Number(item.food.fat),
        fiber: Number(item.food.fiber),
        sugar: Number(item.food.sugar),
        vitaminA: Number(item.food.vitaminA),
        vitaminB1: Number(item.food.vitaminB1),
        vitaminB2: Number(item.food.vitaminB2),
        vitaminB3: Number(item.food.vitaminB3),
        vitaminB5: Number(item.food.vitaminB5),
        vitaminB6: Number(item.food.vitaminB6),
        vitaminB7: Number(item.food.vitaminB7),
        vitaminB9: Number(item.food.vitaminB9),
        vitaminB12: Number(item.food.vitaminB12),
        vitaminC: Number(item.food.vitaminC),
        vitaminD: Number(item.food.vitaminD),
        vitaminE: Number(item.food.vitaminE),
        vitaminK: Number(item.food.vitaminK),
        calcium: Number(item.food.calcium),
        iron: Number(item.food.iron),
        magnesium: Number(item.food.magnesium),
        phosphorus: Number(item.food.phosphorus),
        potassium: Number(item.food.potassium),
        sodium: Number(item.food.sodium),
        zinc: Number(item.food.zinc),
        copper: Number(item.food.copper),
        manganese: Number(item.food.manganese),
        selenium: Number(item.food.selenium),
        chromium: Number(item.food.chromium),
        iodine: Number(item.food.iodine),
      },
    })),
  };
}

savedMealsRouter.post("/", zValidator("json", createSavedMealSchema), async (c) => {
  const { userId, name, items } = c.req.valid("json");

  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const resolvedItems = await Promise.all(
    items.map(async (item) => ({
      servings: item.servings,
      foodId: (await findOrCreateFood(item.food)).id,
    }))
  );

  const savedMeal = await db.savedMeal.create({
    data: {
      userId,
      name,
      items: {
        create: resolvedItems.map((item) => ({
          servings: item.servings,
          foodId: item.foodId,
        })),
      },
    },
    include: { items: { include: { food: true } } },
  });

  return c.json({ success: true, savedMeal: serializeSavedMeal(savedMeal) }, 201);
});

savedMealsRouter.get("/", async (c) => {
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json({ error: "userId is required" }, 400);
  }

  const savedMeals = await db.savedMeal.findMany({
    where: { userId },
    include: { items: { include: { food: true } } },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ savedMeals: savedMeals.map(serializeSavedMeal) });
});

savedMealsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const savedMeal = await db.savedMeal.findUnique({
    where: { id },
    include: { items: { include: { food: true } } },
  });

  if (!savedMeal) {
    return c.json({ error: "Saved meal not found" }, 404);
  }

  return c.json({ savedMeal: serializeSavedMeal(savedMeal) });
});

savedMealsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await db.savedMeal.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: "Saved meal not found" }, 404);
  }

  await db.savedMeal.delete({ where: { id } });
  return c.json({ success: true });
});

export { savedMealsRouter };

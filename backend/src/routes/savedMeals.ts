import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";

const savedMealsRouter = new Hono();

const itemSchema = z.object({
  foodData: z.string(),
  servings: z.number().positive(),
});

savedMealsRouter.get("/", async (c) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);

  const meals = await db.savedMeal.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ savedMeals: meals });
});

savedMealsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      id: z.string(),
      userId: z.string(),
      name: z.string().min(1),
      items: z.array(itemSchema),
    })
  ),
  async (c) => {
    const { id, userId, name, items } = c.req.valid("json");

    try {
      const meal = await db.savedMeal.upsert({
        where: { id },
        create: {
          id,
          userId,
          name,
          items: { create: items },
        },
        update: {
          name,
          items: {
            deleteMany: {},
            create: items,
          },
        },
        include: { items: true },
      });

      return c.json({ savedMeal: meal }, 201);
    } catch (e: any) {
      if (e?.code === "P2003") {
        return c.json({ error: "USER_NOT_FOUND" }, 404);
      }
      throw e;
    }
  }
);

savedMealsRouter.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      items: z.array(itemSchema).optional(),
    })
  ),
  async (c) => {
    const { id } = c.req.param();
    const { name, items } = c.req.valid("json");

    const meal = await db.savedMeal.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(items !== undefined
          ? { items: { deleteMany: {}, create: items } }
          : {}),
      },
      include: { items: true },
    });

    return c.json({ savedMeal: meal });
  }
);

savedMealsRouter.delete("/:id", async (c) => {
  const { id } = c.req.param();
  await db.savedMeal.delete({ where: { id } }).catch(() => {});
  return c.json({ success: true });
});

type MobileFoodObj = {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  category: string;
  image?: string;
  macros: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  micros: {
    vitaminA: number;
    vitaminB1: number;
    vitaminB2: number;
    vitaminB3: number;
    vitaminB5: number;
    vitaminB6: number;
    vitaminB7: number;
    vitaminB9: number;
    vitaminB12: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    calcium: number;
    iron: number;
    magnesium: number;
    phosphorus: number;
    potassium: number;
    sodium: number;
    zinc: number;
    copper: number;
    manganese: number;
    selenium: number;
    chromium: number;
    iodine: number;
  };
};

// Upsert a food from its mobile JSON snapshot, ensuring it exists in the DB.
// This handles local FOOD_DATABASE foods that have never been saved to the backend.
async function ensureFoodExists(foodObj: MobileFoodObj): Promise<string> {
  await db.food.upsert({
    where: { id: foodObj.id },
    create: {
      id: foodObj.id,
      name: foodObj.name,
      brand: foodObj.brand ?? null,
      servingSize: foodObj.servingSize,
      servingUnit: foodObj.servingUnit,
      category: foodObj.category,
      image: foodObj.image ?? null,
      calories: foodObj.macros.calories,
      protein: foodObj.macros.protein,
      carbohydrates: foodObj.macros.carbohydrates,
      fat: foodObj.macros.fat,
      fiber: foodObj.macros.fiber,
      sugar: foodObj.macros.sugar,
      vitaminA: foodObj.micros.vitaminA,
      vitaminB1: foodObj.micros.vitaminB1,
      vitaminB2: foodObj.micros.vitaminB2,
      vitaminB3: foodObj.micros.vitaminB3,
      vitaminB5: foodObj.micros.vitaminB5,
      vitaminB6: foodObj.micros.vitaminB6,
      vitaminB7: foodObj.micros.vitaminB7,
      vitaminB9: foodObj.micros.vitaminB9,
      vitaminB12: foodObj.micros.vitaminB12,
      vitaminC: foodObj.micros.vitaminC,
      vitaminD: foodObj.micros.vitaminD,
      vitaminE: foodObj.micros.vitaminE,
      vitaminK: foodObj.micros.vitaminK,
      calcium: foodObj.micros.calcium,
      iron: foodObj.micros.iron,
      magnesium: foodObj.micros.magnesium,
      phosphorus: foodObj.micros.phosphorus,
      potassium: foodObj.micros.potassium,
      sodium: foodObj.micros.sodium,
      zinc: foodObj.micros.zinc,
      copper: foodObj.micros.copper,
      manganese: foodObj.micros.manganese,
      selenium: foodObj.micros.selenium,
      chromium: foodObj.micros.chromium,
      iodine: foodObj.micros.iodine,
    },
    update: {}, // Don't overwrite an existing backend food record
  });
  return foodObj.id;
}

savedMealsRouter.post(
  "/:id/log",
  zValidator(
    "json",
    z.object({
      userId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      mealType: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
    })
  ),
  async (c) => {
    const { id } = c.req.param();
    const { userId, date, mealType } = c.req.valid("json");

    const meal = await db.savedMeal.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!meal) return c.json({ error: "Saved meal not found" }, 404);
    if (meal.items.length === 0) return c.json({ error: "Saved meal has no items" }, 400);

    const timestamp = BigInt(Date.now());

    // Ensure every food referenced by the saved meal exists in the Food table.
    // Local FOOD_DATABASE items may never have been persisted to the backend.
    const resolvedItems = await Promise.all(
      meal.items.map(async (item) => {
        const foodObj = JSON.parse(item.foodData) as MobileFoodObj;
        const foodId = await ensureFoodExists(foodObj);
        return { foodId, servings: item.servings };
      })
    );

    const entries = await db.$transaction(
      resolvedItems.map(({ foodId, servings }) =>
        db.foodLogEntry.create({
          data: {
            userId,
            foodId,
            servings,
            mealType,
            date,
            timestamp,
          },
          include: { food: true },
        })
      )
    );

    const safeEntries = entries.map(e => ({ ...e, timestamp: e.timestamp.toString() }));
    return c.json({ success: true, entries: safeEntries }, 201);
  }
);

export { savedMealsRouter };

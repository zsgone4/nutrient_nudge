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

    const entries = await db.$transaction(
      meal.items.map((item) => {
        const foodObj = JSON.parse(item.foodData) as { id: string };
        return db.foodLogEntry.create({
          data: {
            userId,
            foodId: foodObj.id,
            servings: item.servings,
            mealType,
            date,
            timestamp,
          },
          include: { food: true },
        });
      })
    );

    return c.json({ success: true, entries }, 201);
  }
);

export { savedMealsRouter };

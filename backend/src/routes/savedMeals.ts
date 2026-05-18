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

export { savedMealsRouter };

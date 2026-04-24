import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";

const updateProfileRouter = new Hono();

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().int().min(1).max(120),
  gender: z.string().min(1, "Gender is required"),
  trainingGoal: z.string().optional(),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
});

updateProfileRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
  }

  const { name, email, age, gender, trainingGoal, goals } = result.data;

  const existing = await db.signup.findFirst({ where: { email, NOT: { id } } });
  if (existing) {
    return c.json({ error: "This email is already registered to another account" }, 409);
  }

  const updated = await db.signup.update({
    where: { id },
    data: { name, email, age, gender, trainingGoal, goals: JSON.stringify(goals) },
    select: { id: true, email: true, name: true },
  });

  return c.json({ success: true, user: updated });
});

export { updateProfileRouter };

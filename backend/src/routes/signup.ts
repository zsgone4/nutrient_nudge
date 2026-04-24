import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";

const signupRouter = new Hono();

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(1).max(120),
  gender: z.string().min(1, "Gender is required"),
  trainingGoal: z.string().optional(),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
  agreedToPolicy: z.literal(true, { message: "You must agree to the policy" }),
});

signupRouter.post("/", async (c) => {
  const body = await c.req.json();
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
  }

  const { email, name, age, gender, trainingGoal, goals, agreedToPolicy } = result.data;

  const existing = await db.signup.findUnique({ where: { email } });
  if (existing) {
    return c.json({ error: "This email is already registered" }, 409);
  }

  const signup = await db.signup.create({
    data: {
      email,
      name,
      age,
      gender,
      trainingGoal,
      goals: JSON.stringify(goals),
      agreedToPolicy,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return c.json({ success: true, user: signup }, 201);
});

export { signupRouter };

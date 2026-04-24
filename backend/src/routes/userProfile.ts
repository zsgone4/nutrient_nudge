import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";

const userProfileRouter = new Hono();

// Create or update user profile schema
const profileSchema = z.object({
  userId: z.string().min(1),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  sex: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["aggressive_cut", "conservative_cut", "maintain", "conservative_bulk", "aggressive_bulk"]),
  isSetup: z.boolean().optional(),
});

// POST /api/user-profile - Create user profile
userProfileRouter.post("/", zValidator("json", profileSchema), async (c) => {
  const { userId, heightCm, weightKg, sex, activityLevel, goal, isSetup } = c.req.valid("json");

  // Verify user exists
  const user = await db.signup.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Check if profile already exists
  const existing = await db.userProfile.findUnique({ where: { userId } });
  if (existing) {
    return c.json({ error: "User profile already exists" }, 409);
  }

  const profile = await db.userProfile.create({
    data: {
      userId,
      heightCm,
      weightKg,
      sex,
      activityLevel,
      goal,
      isSetup: isSetup ?? true,
    },
  });

  return c.json({ success: true, profile }, 201);
});

// GET /api/user-profile/:userId - Get user profile
userProfileRouter.get("/:userId", async (c) => {
  const userId = c.req.param("userId");

  const profile = await db.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return c.json({ error: "User profile not found" }, 404);
  }

  return c.json({ profile });
});

// PATCH /api/user-profile/:userId - Update user profile
const updateProfileSchema = z.object({
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  sex: z.enum(["male", "female"]).optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  goal: z.enum(["aggressive_cut", "conservative_cut", "maintain", "conservative_bulk", "aggressive_bulk"]).optional(),
  isSetup: z.boolean().optional(),
});

userProfileRouter.patch("/:userId", zValidator("json", updateProfileSchema), async (c) => {
  const userId = c.req.param("userId");
  const data = c.req.valid("json");

  const existing = await db.userProfile.findUnique({ where: { userId } });
  if (!existing) {
    return c.json({ error: "User profile not found" }, 404);
  }

  const updated = await db.userProfile.update({
    where: { userId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return c.json({ success: true, profile: updated });
});

export { userProfileRouter };

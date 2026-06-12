import { Hono } from "hono";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "../db";

const signupRouter = new Hono();

// ── Config (set these in Render → Environment) ──
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "https://nutrient-nudge-1.onrender.com";
const APP_SCHEME = process.env.APP_SCHEME ?? "nutrientnudge://"; // your app.json "scheme"
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Nutrient Nudge <onboarding@resend.dev>";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(1).max(120),
  gender: z.string().min(1, "Gender is required"),
  trainingGoal: z.string().optional(),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
  agreedToPolicy: z.literal(true, { message: "You must agree to the policy" }),
  // Profile data — optional so older app builds still succeed
  heightCm: z.number().int().min(100).max(250).optional(),
  weightKg: z.number().min(20).max(300).optional(),
  sex: z.enum(["male", "female"]).optional(),
  activityLevel: z.string().optional(),
  goal: z.string().optional(),
});

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (ch) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[ch] as string)
  );
}

async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping verification email");
    return;
  }
  const verifyUrl = `${PUBLIC_BASE_URL}/api/signup/verify/${token}`;
  const html = `
    <div style="background:#0D0D0D;padding:40px 20px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#1A1A1A;border-radius:18px;padding:32px;border:1px solid #2A2A2A;">
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Verify your email 🌿</h1>
        <p style="color:#9CA3AF;font-size:15px;line-height:22px;margin:0 0 24px;">
          Hi ${esc(name)}, welcome to Nutrient Nudge! Tap below to confirm your email address.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">Verify my email</a>
        <p style="color:#555;font-size:12px;line-height:18px;margin:24px 0 0;">
          If you didn't create a Nutrient Nudge account, you can safely ignore this email.
        </p>
      </div>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: "Verify your email — Nutrient Nudge",
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend send failed:", res.status, await res.text());
  }
}

function successPage(name?: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email verified</title></head>
    <body style="margin:0;background:#0D0D0D;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="max-width:420px;text-align:center;background:#1A1A1A;border-radius:20px;padding:40px 28px;border:1px solid #2A2A2A;">
          <div style="font-size:48px;margin-bottom:12px;">✅</div>
          <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">Email verified!</h1>
          <p style="color:#9CA3AF;font-size:15px;line-height:22px;margin:0 0 28px;">
            Thanks${name ? ", " + esc(name) : ""} — your email is confirmed. Head back to the Nutrient Nudge app to continue.
          </p>
          <a href="${APP_SCHEME}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">Open Nutrient Nudge</a>
        </div>
      </div>
    </body></html>`;
}

function invalidPage(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Link invalid</title></head>
    <body style="margin:0;background:#0D0D0D;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="max-width:420px;text-align:center;background:#1A1A1A;border-radius:20px;padding:40px 28px;border:1px solid #2A2A2A;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h1 style="color:#fff;font-size:24px;margin:0 0 8px;">Link not valid</h1>
          <p style="color:#9CA3AF;font-size:15px;line-height:22px;margin:0;">
            This verification link is invalid or has expired. Open the app and request a new one.
          </p>
        </div>
      </div>
    </body></html>`;
}

// Verify endpoint — defined before "/:id" so it resolves correctly
signupRouter.get("/verify/:token", async (c) => {
  const { token } = c.req.param();
  const user = await db.signup.findUnique({ where: { verificationToken: token } });
  if (!user) return c.html(invalidPage(), 400);

  if (!user.emailVerified) {
    await db.signup.update({
      where: { id: user.id },
      data: { emailVerified: true, verifiedAt: new Date() },
    });
  }
  return c.html(successPage(user.name));
});

// Check if a user exists by ID
signupRouter.get("/:id", async (c) => {
  const { id } = c.req.param();
  const user = await db.signup.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
});

signupRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? "Invalid request" }, 400);
    }

    const {
      email, name, age, gender, trainingGoal, goals, agreedToPolicy,
      heightCm, weightKg, sex, activityLevel, goal,
    } = result.data;

    const hasProfile =
      heightCm != null && weightKg != null && sex && activityLevel && goal;

    // If user already exists by email, return them (supports recovery flow)
    const existing = await db.signup.findUnique({ where: { email } });

    let user: { id: string; email: string; name: string };

    if (existing) {
      user = { id: existing.id, email: existing.email, name: existing.name };
    } else {
      const token = randomUUID();
      const created = await db.signup.create({
        data: {
          email,
          name,
          age,
          gender,
          trainingGoal,
          goals: JSON.stringify(goals),
          agreedToPolicy,
          emailVerified: false,
          verificationToken: token,
        },
        select: { id: true, email: true, name: true },
      });
      user = created;

      // Non-blocking: don't let email delivery hold up or fail signup
      sendVerificationEmail(email, name, token).catch((err) =>
        console.error("verification email failed:", err)
      );
    }

    // Store / update the body profile (idempotent — safe on re-signup)
    if (hasProfile) {
      await db.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          heightCm: heightCm!,
          weightKg: weightKg!,
          sex: sex!,
          activityLevel: activityLevel!,
          goal: goal!,
          isSetup: true,
        },
        update: {
          heightCm: heightCm!,
          weightKg: weightKg!,
          sex: sex!,
          activityLevel: activityLevel!,
          goal: goal!,
          isSetup: true,
        },
      });
    }

    return c.json({ success: true, user }, existing ? 200 : 201);
  } catch (err) {
    console.error("Signup error:", err);
    return c.json({ error: "Something went wrong. Please try again." }, 500);
  }
});

export { signupRouter };

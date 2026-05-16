import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { signupRouter } from "./routes/signup";
import { deleteAccountRouter } from "./routes/deleteAccount";
import { updateProfileRouter } from "./routes/updateProfile";
import { foodsRouter } from "./routes/foods";
import { foodLogsRouter } from "./routes/foodLogs";
import { userProfileRouter } from "./routes/userProfile";
import { goalsRouter } from "./routes/goals";
import { nutrientScoreRouter } from "./routes/nutrientScore";
import { dashboardRouter } from "./routes/dashboard";
import { aiRouter } from "./routes/ai";
import { savedMealsRouter } from "./routes/savedMeals";

const app = new Hono();

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "An unexpected error occurred. Please try again." }, 500);
});

// CORS — allow localhost in dev, plus any origins set in ALLOWED_ORIGINS (comma-separated)
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return origin;
      }
      return extraOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
  })
);

app.use("*", logger());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/signup", signupRouter);
app.route("/api/account", deleteAccountRouter);
app.route("/api/profile", updateProfileRouter);
app.route("/api/foods", foodsRouter);
app.route("/api/food-logs", foodLogsRouter);
app.route("/api/user-profile", userProfileRouter);
app.route("/api/goals", goalsRouter);
app.route("/api/nutrient-score", nutrientScoreRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/ai", aiRouter);
app.route("/api/saved-meals", savedMealsRouter);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

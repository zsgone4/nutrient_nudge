import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { log } from "./lib/logger";
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
      // Native mobile apps don't send Origin — allow them through
      if (!origin) return "*";
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

// Request logging — emits one line per request with method, path, status, latency
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  log.info("http.request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - start,
  });
});

// Catch-all error handler so uncaught throws still surface with context
app.onError((err, c) => {
  log.error("http.unhandled", {
    method: c.req.method,
    path: c.req.path,
    err,
  });
  return c.json({ error: "Internal server error" }, 500);
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/signup", signupRouter);
app.route("/api/account", deleteAccountRouter);
app.route("/api/profile", updateProfileRouter);
app.route("/api/foods", foodsRouter);
app.route("/api/food-logs", foodLogsRouter);
app.route("/api/meals", foodLogsRouter); // Alias for save meal requests
app.route("/api/user-profile", userProfileRouter);
app.route("/api/goals", goalsRouter);
app.route("/api/nutrient-score", nutrientScoreRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/ai", aiRouter);
app.route("/api/saved-meals", savedMealsRouter);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  log.info("server.started", { port, env: process.env.NODE_ENV });
});

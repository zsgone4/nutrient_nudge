import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { signupRouter } from "./routes/signup";
import { deleteAccountRouter } from "./routes/deleteAccount";
import { updateProfileRouter } from "./routes/updateProfile";

const app = new Hono();

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

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`);
});

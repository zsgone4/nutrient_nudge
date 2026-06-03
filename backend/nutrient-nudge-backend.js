Nutrient Nudge — backend integration (Node / Express + Render Postgres)
-------------------------------------------------------------------
This file gives you two things:
1. notifyNewSignup(user) — emails you when someone signs up
2. adminRouter — the endpoint the dashboard reads from

INSTALL
npm install pg cors resend

ENV VARS (set these in Render → your service → Environment)
DATABASE_URL — already set by Render Postgres
ADMIN_API_KEY — any long random string; paste the same value
into ADMIN_KEY in the dashboard
RESEND_API_KEY — from resend.com (free tier is plenty)
ADMIN_EMAIL — where signup alerts get sent (your inbox)
MAIL_FROM — a verified sender, e.g. "signups@yourdomain.com"
(for testing you can use "onboarding@resend.dev")
DASHBOARD_ORIGIN — the URL the dashboard is served from, for CORS
(e.g. "https://admin.yourdomain.com"); omit to allow all
=================================================================== */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { Resend } = require("resend");

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false }, // Render Postgres requires SSL
});

const resend = new Resend(process.env.RESEND_API_KEY);

/* -------------------------------------------------------------------
1) EMAIL ON NEW SIGNUP
Call this from your existing signup handler, right after you INSERT
the new user. Example at the bottom of this file.
------------------------------------------------------------------- */
async function notifyNewSignup(user) {
const row = (label, value) =>
`<tr><td style="padding:4px 14px 4px 0;color:#6f786e">${label}</td>` +
`<td style="padding:4px 0;font-weight:600;color:#16271c">${value ?? "—"}</td></tr>`;

const html = `
<div style="font-family:system-ui,sans-serif;max-width:520px">
<h2 style="color:#1f8a4c;margin:0 0 4px">🌱 New Nutrient Nudge signup</h2>
<p style="color:#6f786e;margin:0 0 16px">${user.name} just joined.</p>
<table style="border-collapse:collapse;font-size:14px">
${row("Email", user.email)}
${row("Age", user.age)}
${row("Height", user.height_cm ? user.height_cm + " cm" : null)}
${row("Weight", user.weight_kg ? user.weight_kg + " kg" : null)}
${row("Goal weight", user.goal_weight_kg ? user.goal_weight_kg + " kg" : null)}
${row("Primary goal", user.primary_goal)}
${row("Activity", user.activity_level)}
${row("Diet", user.dietary_preference)}
${row("Daily calories", user.target_calories)}
${row("Workouts/week", user.workouts_per_week)}
${row("Fitness dream", user.fitness_dream)}
</table>
</div>`;

try {
await resend.emails.send({
from: process.env.MAIL_FROM || "onboarding@resend.dev",
to: process.env.ADMIN_EMAIL,
subject: `New signup: ${user.name}`,
html,
});
} catch (err) {
// never let a failed email break the signup itself
console.error("notifyNewSignup failed:", err.message);
}
}

/* -------------------------------------------------------------------
2) ADMIN ENDPOINT → GET /api/admin/users
The dashboard polls this. Protected by a shared key header.
IMPORTANT: edit the column names in the SELECT to match your table.
------------------------------------------------------------------- */
const adminRouter = express.Router();

adminRouter.use(
cors({ origin: process.env.DASHBOARD_ORIGIN || "*" })
);

adminRouter.get("/api/admin/users", async (req, res) => {
if (req.get("x-admin-key") !== process.env.ADMIN_API_KEY) {
return res.status(401).json({ error: "unauthorized" });
}
try {
const { rows } = await pool.query(`
SELECT
id,
name,
email,
created_at AS "signupDate",
age,
sex,
height_cm AS "heightCm",
weight_kg AS "weightKg",
goal_weight_kg AS "goalWeightKg",
primary_goal AS "primaryGoal",
fitness_dream AS "fitnessDream",
dietary_preference AS "dietaryPreference",
allergies,
activity_level AS "activityLevel",
target_calories AS "targetCalories",
workouts_per_week AS "workoutsPerWeek"
FROM users
ORDER BY created_at DESC
LIMIT 500
`);
res.json(rows);
} catch (err) {
console.error("admin/users query failed:", err.message);
res.status(500).json({ error: "query failed" });
}
});

module.exports = { adminRouter, notifyNewSignup, pool };

/* -------------------------------------------------------------------
HOW TO WIRE IT INTO YOUR APP (in your main server file)
-------------------------------------------------------------------

const express = require("express");
const { adminRouter, notifyNewSignup } = require("./nutrient-nudge-backend");

const app = express();
app.use(express.json());
app.use(adminRouter); // mounts /api/admin/users

// your existing signup route — add ONE line after the insert:
app.post("/api/signup", async (req, res) => {
const newUser = await createUserInDb(req.body); // your existing code
notifyNewSignup(newUser); // <-- fire-and-forget alert
res.json({ ok: true });
});

app.listen(process.env.PORT || 3000);

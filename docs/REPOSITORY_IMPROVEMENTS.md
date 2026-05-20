# Repository Structure & Routing Improvements

This document covers two things:
1. **Documentation coverage** — adding `CLAUDE.md` files and routing/architecture notes across every directory so future contributors (and Claude Code itself) can navigate the monorepo without re-deriving context.
2. **Directory structure** — a clear, end-to-end map of what lives where.

---

## 1. Current state

| Directory | `CLAUDE.md`? | Quality |
|---|---|---|
| `/` (root) | ❌ missing | One-line `README.md` only |
| `backend/` | ✅ present | Stale — generic Hono/Zod template, doesn't mention the actual routes, Prisma schema, or Render deployment |
| `dashboard/` | ❌ missing | Has a `README.md` but no Claude routing notes |
| `mobile/` | ✅ present | Detailed but still says "Expo SDK 53, React Native 0.76.7" — accurate. Has `AGENTS.md` that just points back to `CLAUDE.md` |

The repo has three apps with different stacks (Hono+Prisma, React+Vite, Expo) and a shared mental model (nutrition tracking). New contributors land in the root and have nothing to anchor on.

---

## 2. Target directory structure

```
nutrient_nudge/
├── README.md                       # ← rewrite: what the project is, how the 3 apps connect, dev quickstart
├── CLAUDE.md                       # ← NEW: monorepo routing — when to work in backend/, mobile/, dashboard/
├── CLEANUP.md
├── REPOSITORY_IMPROVEMENTS.md
├── SAVED_MEALS_DEBUG.md
│
├── backend/                        # Hono API on Render, Prisma → Postgres
│   ├── CLAUDE.md                   # ← rewrite: real routes list, Prisma workflow, Render deploy notes
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   ├── CLAUDE.md               # ← NEW (optional): what each script does, when to run it
│   │   ├── start
│   │   ├── studio
│   │   ├── env.sh
│   │   └── seed.ts
│   └── src/
│       ├── CLAUDE.md               # ← NEW (optional): how routes are mounted, db client pattern
│       ├── index.ts
│       ├── env.ts
│       ├── db.ts
│       └── routes/
│           ├── CLAUDE.md           # ← NEW: route-file conventions, validation pattern
│           └── *.ts
│
├── dashboard/                      # React + Vite admin panel
│   ├── CLAUDE.md                   # ← NEW: stack, where API client lives, no auth currently
│   ├── README.md                   # already exists, update API URL claim
│   ├── package.json
│   └── src/
│       ├── api.ts
│       ├── App.tsx
│       ├── main.tsx
│       └── components/
│
└── mobile/                         # Expo Router app
    ├── CLAUDE.md                   # already detailed, keep
    ├── AGENTS.md                   # already redirects to CLAUDE.md
    ├── package.json
    └── src/
        ├── app/                    # Expo Router file-based routes
        │   ├── _layout.tsx
        │   ├── (tabs)/
        │   │   └── _layout.tsx
        │   └── ...
        ├── components/
        └── lib/
            ├── state/              # Zustand stores
            ├── data/               # static FOOD_DATABASE
            ├── hooks/
            ├── types/
            └── utils/
```

Bold idea but optional: nested `CLAUDE.md` files inside `src/routes/`, `src/app/`, etc. Claude Code picks them up automatically when working in that subtree, so you can keep each one short and scoped.

---

## 3. Suggested file contents

### 3.1 Root `CLAUDE.md` (NEW)

```markdown
<monorepo>
  Three apps share one Prisma schema:
  - backend/   Hono API + Prisma → Postgres on Render. Source of truth for users.
  - mobile/    Expo Router app. Most state lives in client-side Zustand (AsyncStorage).
  - dashboard/ React + Vite admin view. Read-only.

  Deployment:
  - backend → Render (https://nutrient-nudge-1.onrender.com)
  - mobile  → Expo / EAS
  - dashboard → not yet deployed
</monorepo>

<conventions>
  - Bun for backend, npm/bun for dashboard, bun for mobile.
  - TypeScript everywhere, strict mode.
  - Zod for validation at API boundaries.
  - Tailwind v3 (NativeWind on mobile).
</conventions>

<where_to_work>
  - API logic, DB schema, AI prompts → backend/
  - Screens, navigation, local state → mobile/
  - Admin views, user listing, charts → dashboard/
  - Shared constants (daily values, micronutrient list) are currently DUPLICATED
    across all three apps. See CLEANUP.md for the consolidation plan.
</where_to_work>

<known_drift>
  - Mobile keeps food logs, nutrient scores, user profile in Zustand only.
    The matching backend routes exist but are never called.
  - Daily-value tables disagree across files. Don't pick one at random — see CLEANUP.md.
</known_drift>
```

### 3.2 `backend/CLAUDE.md` (REWRITE)

The current file is generic boilerplate. Replace with:

```markdown
<stack>
  Bun runtime, Hono web framework, Zod validation, Prisma ORM.
  Database: PostgreSQL on Render in production, SQLite locally if you flip the
  schema provider.
</stack>

<structure>
  src/index.ts       — App entry, CORS, route mounting
  src/env.ts         — Zod-validated env loader; import at startup
  src/db.ts          — Singleton Prisma client
  src/routes/        — One file per resource, mounted at /api/<name>
  prisma/schema.prisma
  prisma/migrations/
  scripts/start      — Render entry; runs prisma generate + db push
  scripts/seed.ts    — Idempotent food seed
</structure>

<routes>
  Mounted under /api in src/index.ts:
    /api/signup            POST   create signup
    /api/account/:id       DELETE remove user (cascades)
    /api/profile/:id       PATCH  update signup profile
    /api/foods             GET, POST, /search
    /api/food-logs         CRUD   (currently unused by mobile)
    /api/user-profile      CRUD   (currently unused by mobile)
    /api/goals/:userId     GET    (currently unused by mobile)
    /api/nutrient-score    POST /calculate, GET history, GET :userId/:date  (currently unused by mobile)
    /api/dashboard         /users, /users/:id, /stats
    /api/ai/zach           POST   Anthropic-backed nutrition advice

  Add a route: create src/routes/foo.ts that exports `fooRouter`, then mount
  with `app.route("/api/foo", fooRouter)` in src/index.ts.
  Always prefix with /api/.
</routes>

<env>
  Required: DATABASE_URL
  Optional: PORT (default 3000), NODE_ENV, ALLOWED_ORIGINS, ANTHROPIC_API_KEY,
            ANTHROPIC_MODEL (default claude-sonnet-4-6)
  All required vars are validated in src/env.ts on startup.
</env>

<database>
  Production: PostgreSQL on Render.
  Local: change schema.prisma provider to "sqlite" and DATABASE_URL to file:./dev.db.
  Migrations live in prisma/migrations/. Run `bunx prisma migrate dev` after schema changes.
</database>
```

### 3.3 `backend/src/routes/CLAUDE.md` (NEW, optional)

```markdown
<conventions>
  - Each file exports one Hono router and is mounted in src/index.ts.
  - Validate request bodies with @hono/zod-validator: `zValidator("json", schema)`.
  - Return shape: `{ success: true, ... }` for writes, `{ error: "..." }` with HTTP 4xx for failures.
  - Use the singleton db from "../db" — never instantiate PrismaClient here.
  - Convert relations defensively (`JSON.parse(user.goals || "[]")`) when the column
    is a stringified JSON array.
</conventions>

<gotchas>
  - The `Signup.goals` column is a stringified JSON array, not a Postgres array.
  - `NutrientScore.micronutrients` is also a stringified JSON object.
  - `FoodLogEntry.timestamp` is BigInt — Hono serializes it as a number; if you ever
    add fields > 2^53 you'll need a JSON replacer.
</gotchas>
```

### 3.4 `dashboard/CLAUDE.md` (NEW)

```markdown
<stack>
  React 18 + Vite + TailwindCSS + Axios + Recharts. TypeScript strict.
  No auth currently — anyone with the URL sees all users.
</stack>

<structure>
  src/main.tsx                  — React entry
  src/App.tsx                   — Root layout, fetches stats + users on mount
  src/api.ts                    — Axios client. API base URL is HARD-CODED here.
  src/components/Stats.tsx      — Top-of-page metric cards
  src/components/UsersTable.tsx — Main user list
  src/components/UserDetailModal.tsx — Per-user drill-down with score history chart
</structure>

<endpoints_used>
  GET /api/dashboard/stats
  GET /api/dashboard/users
  GET /api/dashboard/users/:userId
  GET /api/nutrient-score/history/:userId
</endpoints_used>

<known_issues>
  - API_BASE_URL in src/api.ts is hard-coded to the Render URL. Should read from
    import.meta.env.VITE_API_BASE_URL with a localhost fallback for dev.
  - Branded "VibCode" in App.tsx and README — should be Nutrient Nudge.
  - Because mobile doesn't push food logs / scores to the backend, the dashboard
    shows empty foodEntries/nutrientScores for all users.
</known_issues>
```

### 3.5 `mobile/CLAUDE.md` (KEEP, light edits)

The current file is good. Two suggested edits:

- The stack header says "Expo SDK 53, React Native 0.76.7" — `package.json` says `react-native@0.79.6`. Update.
- Add a `<backend>` section pointing at `EXPO_PUBLIC_BACKEND_URL` and listing which endpoints the app actually calls (signup, account delete, profile update, foods search/POST, ai/zach). Make explicit that food logs and scores live in Zustand only.

### 3.6 `mobile/AGENTS.md` (KEEP)

Already a redirect. Fine as-is.

---

## 4. Routing notes (mobile)

Mobile uses Expo Router file-based routing. To make navigation legible without opening files, here's the route graph:

```
/  (gated by user-store.hasSignedUp in app/_layout.tsx)
│
├── /signup                     (full-screen)
├── /account-deleted            (full-screen, no back gesture)
│
├── /(tabs)
│    ├── /(tabs)/two            → "Score" tab (micronutrient breakdown)
│    ├── /(tabs)/index          → "Dashboard" tab (daily meals + Zach AI)
│    └── /(tabs)/profile        → "Profile" tab (body metrics, macros, goals)
│
├── /add-food         [modal]   accepts ?mealType=... &foodId=...
├── /meal-detail      [modal-ish] accepts ?mealType=...
├── /sources          [modal]
├── /settings         [modal]
└── /modal            [modal]   default Expo template, probably deletable
```

Routing conventions worth documenting (in `mobile/CLAUDE.md` or a `mobile/src/app/CLAUDE.md`):
- Tabs are registered in `src/app/(tabs)/_layout.tsx`; only files referenced there become real tabs.
- Modals are declared in `src/app/_layout.tsx` via `<Stack.Screen ... presentation: 'modal' />`.
- All routes that consume params do so via `useLocalSearchParams<{ ... }>()`.

---

## 5. Action checklist

- [ ] Add root `CLAUDE.md` (Section 3.1).
- [ ] Rewrite `backend/CLAUDE.md` with the real routes (Section 3.2).
- [ ] Add `backend/src/routes/CLAUDE.md` (Section 3.3) — optional.
- [ ] Add `dashboard/CLAUDE.md` (Section 3.4).
- [ ] Update `mobile/CLAUDE.md` stack version + add `<backend>` section.
- [ ] Rewrite root `README.md` with: project description, what each app does, how to run all three locally, deployment targets.
- [ ] Delete `mobile/exclude.txt`, `mobile/package.json.backup-*`, `changelog.txt` (see CLEANUP.md).

# Repository Cleanup Review

End-to-end review of the `nutrient_nudge` monorepo (`backend/`, `mobile/`, `dashboard/`). Each item is a suggestion — none of them have been applied. Order them however you like; a safe ordering is at the bottom.

---

## Critical — secrets & abandoned data

1. **`backend/.env` is committed** with an `OPENAI_API_KEY` value. Even if the key looks fake, it should not be tracked. `backend/.gitignore` only excludes `.env.*.local` variants — add `.env` itself. Rotate any real key that may have ever lived there.
   - File: `backend/.env:2`
   - Gitignore: `backend/.gitignore:21-24`

2. **`mobile/.env` is committed** with five `EXPO_PUBLIC_*` keys. `EXPO_PUBLIC_*` values do ship in the bundle, but they still shouldn't be in git. Move to `mobile/.env.local`.

3. **`backend/prisma/dev.db`** (~1.5 MB SQLite) is committed. The Prisma datasource is now `postgresql`, so this file is dead weight and may contain stale user data. Delete it and add `*.db` to `backend/.gitignore`.

---

## Architectural — backend half-wired to mobile

The mobile app calls only 5 of the 10 backend route groups. These exist server-side but **nothing in mobile ever calls them**:

| Route | Status |
|---|---|
| `/api/food-logs/*` | Unused — mobile keeps logs in persisted Zustand only |
| `/api/nutrient-score/*` | Unused — score computed locally each render |
| `/api/user-profile/*` | Unused — profile lives in Zustand |
| `/api/goals/*` | Unused — recomputed locally in `nutrition-store.ts:46-100` |

Consequence: the dashboard's view of a user is mostly empty because food logs and scores never leave the device. Either:

- (a) Wire the mobile app to POST food logs / scores up to the backend, **or**
- (b) Delete the unused backend routes plus the `FoodLogEntry`, `NutrientScore`, `UserProfile` Prisma models.

Right now BMR/TDEE/macro math is duplicated in `backend/src/routes/goals.ts:52-105` and `mobile/src/lib/state/nutrition-store.ts:46-100` for endpoints nobody calls.

---

## Dead code / unused files

### Backend
- `backend/src/routes/sample.ts` — defined but never mounted in `index.ts`. Delete.
- `backend/src/lib/vibecode.ts` — explicitly commented as "kept to avoid import errors"; zero references. Delete the file and the empty `lib/` directory.
- `backend/scripts/seed-comprehensive.ts` (333 lines) and `backend/scripts/seed.ts` — neither referenced by `package.json` or `scripts/start`. Pick one, wire it up, delete the other.
- `backend/scripts/start` and `backend/scripts/env.sh` still contain Vibecode-specific paths and SQLite backup logic. Now that you're on Render with Postgres, replace with a simpler `prisma migrate deploy && bun src/index.ts`.
- `backend/package.json` lists `@vibecodeapp/backend-sdk`, `@vibecodeapp/cloud-studio`, `@vibecodeapp/proxy` — none are imported in `src/`. `cloud-studio` is only referenced from `scripts/studio`. Prune unless you still rely on cloud-studio.

### Mobile
- `mobile/console-fix.ts` — workaround for the React Native version mismatch caused by the `postinstall` script in `mobile/package.json:12` that rewrites `ReactNativeVersion.js`. If you can drop the postinstall, this whole file goes away.
- `mobile/exclude.txt` — empty file.
- `mobile/icon.png` — 1.6 MB at repo root, should live under `assets/` if used.
- `mobile/package.json.backup-2026-04-23T19-02-58-687Z` — backup file checked in. Delete.
- `mobile/src/lib/state/example-state.ts` — first line says "DO NOT USE THIS FILE". Delete.
- `mobile/src/components/Themed.tsx` — never imported. Delete.
- `mobile/src/lib/useClientOnlyValue.ts` / `.web.ts` — never imported. Delete.
- `mobile/src/lib/useColorScheme.ts` is a one-line re-export; consider inlining if you no longer ship a web build, or keep both shims if you do.
- `mobile/package.json` has `@vibecodeapp/sdk` — only used by `metro.config.js`. If you can drop the metro wrapper, drop the dep.

### Root
- `changelog.txt` — 61 lines of `- Changes made by agent <timestamp>` with no real content. Delete or replace with a meaningful changelog.
- `README.md` — one line. Either flesh it out (run instructions for the three apps) or leave it as the placeholder it is.

---

## Duplication & inconsistency

- **Daily-value tables are defined three times** and already disagree:
  - `mobile/src/lib/types/nutrition.ts:138-174`
  - `backend/src/routes/goals.ts:23-49`
  - `backend/src/routes/nutrientScore.ts:9-35`
  - Examples of disagreement: `calcium` 1000 (mobile) vs 1200 (backend); `phosphorus` 700 vs 1000; `potassium` 4700 vs 3500.
  - Pick one source of truth.
- **Goal-adjustment percentages disagree**: backend uses ±0.125 for conservative cut/bulk; mobile uses ±0.10.
  - `backend/src/routes/goals.ts:16-21` vs `mobile/src/lib/types/nutrition.ts:104-110`
- **`emptyMicros` zero-object is recreated in 5+ places**:
  - `mobile/src/lib/data/foods.ts:4`, `mobile/src/lib/state/nutrition-store.ts:27`, `mobile/src/app/(tabs)/index.tsx:29`, `mobile/src/app/add-food.tsx:144`, `backend/scripts/seed.ts:3`.
- The 25-name micronutrient list appears verbatim in ~7 files. Define once.
- `signup` and `updateProfile` validation schemas are near-identical (`backend/src/routes/signup.ts:7-15`, `backend/src/routes/updateProfile.ts:7-14`). Share a base schema.
- Mobile redeclares `BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? ''` in 5 files. One module export would be cleaner and would let you fail-fast if it's missing.

---

## Minor

- `dashboard/src/api.ts:3` hard-codes the Render URL. Use a Vite env var so dev can point at `localhost:3000`. The README claims this already works — it doesn't.
- `dashboard/src/App.tsx:51` and `dashboard/README.md` still say "VibCode". Rebrand to Nutrient Nudge.
- `backend/src/env.ts` validates `DATABASE_URL` but not `ANTHROPIC_API_KEY`. `backend/src/routes/ai.ts:7` silently falls back to `""` → every AI call fails in prod with a non-obvious error.
- `mobile/src/lib/state/nutrition-store.ts:159, 166` — leftover `console.log` debug statements.
- `mobile/src/lib/state/nutrition-store.ts:20` — uses deprecated `String.prototype.substr`. Switch to `slice`.
- `backend/src/routes/foodLogs.ts:117` types `whereClause: any` — use `Prisma.FoodLogEntryWhereInput`.
- `backend/src/routes/nutrientScore.ts:100-122` does `findUnique` then `update`; collapse into `db.nutrientScore.upsert` (the unique constraint `@@unique([userId, date])` already exists).
- `backend/src/routes/foods.ts:91-127` manually `Number()`-casts 30 Prisma `Float` fields that are already numbers. Drop the cast block.
- `backend/src/routes/dashboard.ts:147-157` does `findMany` then counts by goal — replace with `db.userProfile.groupBy({ by: ['goal'], _count: true })`.
- `mobile/src/lib/data/foods.ts` is 3,867 lines / 134 KB shipping in the bundle. With backend `/api/foods/search` already half-wired, prune this or lazy-load.
- `backend/src/index.ts:28-36` CORS callback returns `null` for disallowed origins, which Hono coerces to the string `"null"` in the header. Return `undefined` instead.

---

## Suggested order

1. **Move `.env` files out of git, tighten `.gitignore`, remove `dev.db`.** Verify build still works.
2. **Delete confirmed-unused files**: `sample.ts`, `vibecode.ts`, `Themed.tsx`, `useClientOnlyValue*`, `example-state.ts`, `exclude.txt`, `package.json.backup-*`, `changelog.txt`.
3. **Remove unused `@vibecodeapp/*` deps** (after rewriting `metro.config.js` and `scripts/start` to not depend on them).
4. **Centralize shared constants**: `BACKEND_URL`, `emptyMicros`, micronutrient list, daily-value table.
5. **Decide the backend's role.** Either wire mobile → backend for logs/scores, or delete the unused routes and Prisma models. This is the biggest architectural decision and gates the next step.
6. **Resolve the daily-value disagreements** once the source of truth is chosen.
7. **Replace dual seed scripts** with one wired-up seed.
8. **Add `ANTHROPIC_API_KEY` to env schema**; fix CORS return value; env-var the dashboard API URL.

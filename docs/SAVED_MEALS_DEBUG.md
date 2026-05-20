# Saved Meals — Debugging Report

The "saved meals" feature is the meal-logging pipeline: a user adds food on the dashboard or via the add-food modal, the entry is persisted, and it should appear on the dashboard, the meal-detail view, and the Score tab. This report walks the flow, identifies the design pattern, and lists the most likely reasons it isn't behaving as expected.

---

## 1. The design pattern

The dominant pattern is **client-side persisted state via Zustand + AsyncStorage**, with the backend treated as a thin signup/AI service.

- **State container**: `useNutritionStore` in `mobile/src/lib/state/nutrition-store.ts`.
- **Persistence**: Zustand `persist` middleware → AsyncStorage under the key `nutrition-storage`. `partialize` saves `logs`, `dailyGoals`, `userProfile`, `macroGoalsOverridden`.
- **Source of truth**: the device. The backend has `FoodLogEntry` and `NutrientScore` Prisma models with full CRUD endpoints, but **mobile never calls them** — the only meal/score data the backend ever sees is whatever the dashboard route aggregates from those (empty) tables.
- **Read pattern**: components read with `useNutritionStore(s => s.logs[s.selectedDate] ?? EMPTY_ENTRIES)`.
- **Write pattern**: components call `addFoodEntry / removeFoodEntry / updateFoodEntry`, which mutate the slice for `get().selectedDate`.

The data shape is denormalized — each `FoodLogEntry` carries the whole `Food` object (macros + micros) inline rather than just a `foodId` reference:

```ts
// nutrition-store.ts:148-158
addFoodEntry: (food, servings, mealType) => {
  const date = get().selectedDate;
  const entry: FoodLogEntry = {
    id: generateId(),
    food,            // ← entire Food object embedded
    servings,
    mealType,
    timestamp: Date.now(),
    date,
  };
  ...
}
```

---

## 2. The full flow

```
add-food.tsx
  user taps a food in the list
    → setSelectedFood(food)
  user taps "Add"
    → addFoodEntry(selectedFood, servings, mealType)            [nutrition-store.ts:148]
        ↓
  Zustand state mutation
    logs[get().selectedDate].push(entry)
    → persist middleware writes JSON to AsyncStorage

(tabs)/index.tsx        — reads logs[selectedDate], groups by mealType
meal-detail.tsx         — same, filtered by mealType param
(tabs)/two.tsx (Score)  — sums micros across logs[selectedDate]
```

All three readers depend on `selectedDate` matching the date used when the entry was written.

---

## 3. Bugs found, by severity

### 🔴 3.1 `selectedDate` goes stale at midnight — most likely cause of "missing meals"

`mobile/src/lib/state/nutrition-store.ts:146`
```ts
selectedDate: getTodayString(),
```

`getTodayString()` runs **once** when the JS module first evaluates. Two scenarios where this bites:

1. **App backgrounded across midnight.** Expo doesn't reload the JS bundle when the app returns from background, so `selectedDate` is still yesterday. The user opens the app, taps a meal, adds food → the entry is logged under **yesterday's date**. The dashboard header shows "Today" (because `(tabs)/index.tsx:130-131` derives `isToday` from `new Date()`), but the meal cards stay empty because they read `logs[selectedDate]` (yesterday).

2. **Phone clock moves forward.** Same outcome — the store's notion of "today" lags reality.

Symptom the user actually sees: *"I added a meal, it disappeared / never showed up."* The entry **is** in AsyncStorage, just filed under the wrong date.

**Fix options**, in order of preference:

- **A. Refresh `selectedDate` on every app foreground.** In `mobile/src/app/_layout.tsx`, subscribe to `AppState`:

  ```ts
  import { AppState } from 'react-native';
  ...
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        const today = new Date().toISOString().split('T')[0];
        if (useNutritionStore.getState().selectedDate !== today) {
          useNutritionStore.getState().setSelectedDate(today);
        }
      }
    });
    return () => sub.remove();
  }, []);
  ```

- **B. Always compute the date at write time, not from store state.** Change `addFoodEntry`:

  ```ts
  addFoodEntry: (food, servings, mealType) => {
    const date = new Date().toISOString().split('T')[0];
    ...
  }
  ```

  This is the smallest, most defensive fix — the entry's `date` is always *actual* today, regardless of what `selectedDate` is.

- **C. Both.** A is what the user wants visually; B keeps writes correct even if A is forgotten.

Recommended: **A + B together.** B alone leaves the dashboard showing yesterday until the user manually triggers a state refresh.

---

### 🔴 3.2 `removeFoodEntry` / `updateFoodEntry` silently miss entries from other dates

`mobile/src/lib/state/nutrition-store.ts:171-191`
```ts
removeFoodEntry: (entryId) => {
  const date = get().selectedDate;
  set(state => ({
    logs: {
      ...state.logs,
      [date]: (state.logs[date] || []).filter(e => e.id !== entryId),
    },
  }));
},
```

Both actions only mutate `logs[get().selectedDate]`. If the entry the user is trying to delete lives under a different date (which is exactly the scenario in 3.1), the filter looks at the wrong array, finds nothing, and the call is a no-op. The UI updates optimistically (the entry vanishes from the local `entries` memo because Zustand emits a change event) — but on next render the old data is still there.

User-visible symptom: *"I deleted a meal and it came back."*

**Fix:** make both actions search across all date buckets, or accept the entry's `date` as a second parameter and have the UI pass `entry.date`. Across-all-dates is the safer fix because callers don't need to change:

```ts
removeFoodEntry: (entryId) => set(state => {
  const next: typeof state.logs = {};
  for (const [date, list] of Object.entries(state.logs)) {
    next[date] = list.filter(e => e.id !== entryId);
  }
  return { logs: next };
}),
```

---

### 🟠 3.3 Backend food search loses micronutrients

`backend/src/routes/foods.ts:60-74` — the `/api/foods/search` response selects only the macro columns:

```ts
select: {
  id: true, name: true, brand: true, servingSize: true, servingUnit: true,
  category: true, image: true,
  calories: true, protein: true, carbohydrates: true, fat: true, fiber: true,
},
```

…no `vitaminA`, no `iron`, no `vitaminC`, etc.

The mobile client at `mobile/src/app/add-food.tsx:144-149` then fills micros with zeros:

```ts
micros: {
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, ..., iodine: 0,
},
```

A meal added via search will therefore contribute **zero micronutrients** to the Score tab, even though the underlying `Food` row in Postgres has the real values. User reports this as: *"the Score isn't going up even though I logged a balanced meal."*

**Fix:** remove the `select` in `foods.ts` (return all columns) or expand it to include all micros, then drop the zero-fill in `add-food.tsx`.

---

### 🟠 3.4 Preselected food lookup only searches local FOOD_DATABASE

`mobile/src/app/add-food.tsx:184`
```ts
preselectedFoodId ? FOOD_DATABASE.find(f => f.id === preselectedFoodId) || null : null
```

If anything navigates to `/add-food?foodId=<id>` with an ID from the backend (`cuid`) or a barcode (`barcode-12345`), this lookup returns `null` and the modal silently opens to its search view. Nothing currently exercises this path in the codebase, but the moment someone wires "repeat last meal" or "add from history" → it will quietly fail.

**Fix:** if the ID isn't in `FOOD_DATABASE`, also check `apiResults` and/or hit `/api/foods/:id`.

---

### 🟡 3.5 Denormalized `Food` inside `FoodLogEntry`

Each entry stores the full `Food` object. Two consequences:

1. **AsyncStorage bloat.** Every log entry serializes the entire micros table (25 numbers + macros + metadata). A month of food logging is hundreds of KB of redundant data.
2. **Frozen-in-time food data.** If you later improve the seed (e.g., add micros to `Banana`), already-logged Banana entries keep the old zeroed micros forever.

Not breaking the feature today, but it caps how good the Score tab can ever be.

**Fix:** store only `foodId` + `servings` + `mealType` + `date` + `timestamp`. Look up the food at render time. Requires the FOOD_DATABASE / backend `/api/foods/:id` to be reliably available.

---

### 🟡 3.6 `Alert.alert` in `meal-detail.tsx:57-72`

`mobile/CLAUDE.md` explicitly says **"Use custom modals, not Alert.alert()"**. The delete-confirmation in meal-detail violates the project convention. Cosmetic on iOS, but on Android the Alert styling is jarring vs. the rest of the app.

**Fix:** replace with a small `<Modal transparent visible={...} />` that matches the app theme.

---

### 🟡 3.7 Debug `console.log` left in store

`nutrition-store.ts:159, 166`
```ts
console.log('[NutritionStore] Adding food entry:', { ... });
console.log('[NutritionStore] New logs for date:', date, ...);
```

Not a bug per se, but if you're hunting for missing meals these will fire in dev — and they'll spam the production logs if the build doesn't strip them. The fact they're still there suggests someone *was* debugging this exact feature recently and didn't finish.

---

## 4. Hypothesis: why the feature seems "broken"

Given the symptoms typically reported ("I added food but it's not showing up"), the most likely root cause is **3.1 (stale `selectedDate`)** combined with **3.2 (mutations scoped to the stale date)**. They compound:

1. User logs food at 11pm.
2. App stays backgrounded overnight.
3. User opens app at 8am. Dashboard says "Today" (real today) but reads `logs[yesterday]` — empty.
4. User adds a new meal. Write goes to `logs[yesterday]` (stale `selectedDate`). Dashboard still reads `logs[yesterday]` and shows the new entry, but the header still says "Today" — so the user *thinks* they logged today's breakfast. They didn't. Tomorrow's dashboard will show neither.
5. User tries to delete the rogue entry from yesterday's view → if `selectedDate` has by now been refreshed (e.g., by a code path that called `setSelectedDate`), the delete silently misses.

The whole thing is internally consistent enough that nothing crashes, which is why it's been shipping. Apply fixes 3.1A + 3.1B + 3.2 together and the feature should behave.

---

## 5. Test plan after the fix

- **Cold start at 11:55pm → log a meal → wait until 12:05am → log another meal.** Both should appear on their respective dates. The second one should appear on "Today" after midnight.
- **Background the app for 24h → reopen → check dashboard.** Should show today's empty state, not yesterday's data.
- **Delete a meal logged yesterday from any view.** It should stay deleted on reopen.
- **Add a meal via search ("Banana") → open the Score tab.** Vitamin B6 / potassium should move, not stay at zero.
- **Add a meal via barcode (try `737628064502`).** Macros should be sane, micros should be the OpenFoodFacts values (still imperfect, but non-zero where available).

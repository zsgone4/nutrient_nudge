// backend/src/routes/foods.ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const foodsRouter = new Hono();

/* ------------------------------- helpers ------------------------------- */

const OFF_USER_AGENT = "NutrientNudge/1.0 (zachstewartstone@gmail.com)";

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

function gToMg(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : n * 1000;
}

function toNumeric(food: any) {
  const fields = [
    "servingSize","calories","protein","carbohydrates","fat","fiber","sugar",
    "vitaminA","vitaminB1","vitaminB2","vitaminB3","vitaminB5","vitaminB6",
    "vitaminB7","vitaminB9","vitaminB12","vitaminC","vitaminD","vitaminE","vitaminK",
    "calcium","iron","magnesium","phosphorus","potassium","sodium","zinc","copper",
    "manganese","selenium","chromium","iodine",
  ];
  const out: any = { ...food };
  for (const f of fields) out[f] = Number(food[f] ?? 0);
  return out;
}

function categoryFromTags(product: any): string {
  const tags: string = (product.categories_tags ?? []).join(" ").toLowerCase();
  if (/beverage|drink|water|soda|juice|coffee|tea/.test(tags)) return "beverages";
  if (/dairy|milk|cheese|yogurt|yoghurt/.test(tags)) return "dairy";
  if (/fruit/.test(tags)) return "fruits";
  if (/vegetable/.test(tags)) return "vegetables";
  if (/bread|cereal|pasta|rice|grain/.test(tags)) return "grains";
  if (/meat|fish|poultry|egg|seafood|legume/.test(tags)) return "protein";
  if (/oil|butter|fat/.test(tags)) return "fats";
  if (/meal|prepared|dish|pizza|soup/.test(tags)) return "prepared";
  return "snacks";
}

function mapOffToFood(product: any, barcode: string) {
  const n = product.nutriments ?? {};
  let calories = num(n["energy-kcal_100g"]);
  if (calories === null) {
    const kj = num(n["energy-kj_100g"]);
    if (kj !== null) calories = Math.round(kj / 4.184);
  }
  const sodiumG = num(n["sodium_100g"]);
  return {
    barcode,
    name: product.product_name?.trim() || `Product ${barcode}`,
    brand: product.brands?.split(",")[0]?.trim() || null,
    servingSize: 100,
    servingUnit: "g",
    category: categoryFromTags(product),
    source: "openfoodfacts",
    sourceId: barcode,
    image: product.image_url || null,
    calories: calories ?? 0,
    protein: num(n["proteins_100g"]) ?? 0,
    carbohydrates: num(n["carbohydrates_100g"]) ?? 0,
    fat: num(n["fat_100g"]) ?? 0,
    fiber: num(n["fiber_100g"]),
    sugar: num(n["sugars_100g"]),
    sodium: sodiumG === null ? null : sodiumG * 1000,
    calcium: gToMg(n["calcium_100g"]),
    iron: gToMg(n["iron_100g"]),
    potassium: gToMg(n["potassium_100g"]),
    vitaminC: gToMg(n["vitamin-c_100g"]),
  };
}

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

const NUTRIENT_MAP: Record<string, string> = {
  "208": "calories", "203": "protein", "205": "carbohydrates", "204": "fat",
  "291": "fiber", "269": "sugar",
  "320": "vitaminA", "404": "vitaminB1", "405": "vitaminB2", "406": "vitaminB3",
  "410": "vitaminB5", "415": "vitaminB6", "416": "vitaminB7", "417": "vitaminB9",
  "418": "vitaminB12", "401": "vitaminC", "328": "vitaminD", "323": "vitaminE",
  "430": "vitaminK",
  "301": "calcium", "303": "iron", "304": "magnesium", "305": "phosphorus",
  "306": "potassium", "307": "sodium", "309": "zinc", "312": "copper",
  "315": "manganese", "317": "selenium",
};

function categoryFromText(desc: string): string {
  const d = desc.toLowerCase();
  if (/beverage|drink|water|soda|juice|coffee|tea|beer|wine/.test(d)) return "beverages";
  if (/milk|cheese|yogurt|yoghurt|cream|butter/.test(d)) return "dairy";
  if (/apple|banana|berr|fruit|orange|grape|melon|peach|pear|mango/.test(d)) return "fruits";
  if (/broccoli|carrot|spinach|vegetable|lettuce|tomato|potato|onion|pepper/.test(d)) return "vegetables";
  if (/bread|cereal|pasta|rice|grain|oat|wheat|flour|noodle/.test(d)) return "grains";
  if (/chicken|beef|pork|fish|egg|turkey|bean|lentil|tofu|meat|salmon|tuna/.test(d)) return "protein";
  if (/oil|lard|shortening|margarine/.test(d)) return "fats";
  return "prepared";
}

function mapUsdaFood(item: any) {
  const byNumber: Record<string, number> = {};
  for (const fn of item.foodNutrients ?? []) {
    const number = String(fn.number ?? fn.nutrientNumber ?? "");
    const amount = Number(fn.amount);
    if (number && Number.isFinite(amount)) byNumber[number] = amount;
  }
  const food: any = {
    name: (item.description ?? "").trim(),
    brand: null,
    servingSize: 100,
    servingUnit: "g",
    category: categoryFromText(item.description ?? ""),
    source: "usda",
    sourceId: String(item.fdcId),
    calories: 0, protein: 0, carbohydrates: 0, fat: 0,
  };
  for (const [number, field] of Object.entries(NUTRIENT_MAP)) {
    if (byNumber[number] !== undefined) food[field] = byNumber[number];
  }
  return food;
}

async function runUsdaSeed(apiKey: string) {
  const existing = await db.food.findMany({
    where: { source: "usda" },
    select: { sourceId: true },
  });
  const seen = new Set(existing.map((f) => f.sourceId));
  let pageNumber = 1;
  let total = 0;
  while (true) {
    const res = await fetch(`${FDC_BASE}/foods/list?api_key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataType: ["Foundation", "SR Legacy"], pageSize: 200, pageNumber }),
    });
    if (!res.ok) { console.error(`USDA ${res.status}: ${await res.text()}`); break; }
    const page = (await res.json()) as any[];
    if (!page.length) break;

    const batch = page
      .filter((it) => it.description && !seen.has(String(it.fdcId)))
      .map(mapUsdaFood);
    for (const f of batch) seen.add(f.sourceId);

    if (batch.length) {
      await db.food.createMany({ data: batch, skipDuplicates: true });
      total += batch.length;
      console.log(`USDA seed: page ${pageNumber}, +${batch.length} (total ${total})`);
    }
    pageNumber++;
  }
  console.log(`USDA seed finished. Imported ${total} foods.`);
}

/* --------------------------- CoFID (UK) seed --------------------------- */
// Loads the committed cofid-foods.json. Tries several locations so it works
// whether Render's working directory is the repo root or the backend folder.
function loadCofidFile(): any[] {
  const candidates = [
    join(process.cwd(), "cofid-foods.json"),
    join(process.cwd(), "backend", "cofid-foods.json"),
    join(process.cwd(), "data", "cofid-foods.json"),
    join(process.cwd(), "backend", "data", "cofid-foods.json"),
    join(process.cwd(), "src", "data", "cofid-foods.json"),
    join(process.cwd(), "backend", "src", "data", "cofid-foods.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = readFileSync(p, "utf-8");
      console.log(`CoFID seed: loaded ${p}`);
      return JSON.parse(raw);
    } catch {
      // try next candidate
    }
  }
  throw new Error(`cofid-foods.json not found. Tried: ${candidates.join(", ")}`);
}

async function runCofidSeed() {
  const all = loadCofidFile();
  const existing = await db.food.findMany({
    where: { source: "cofid" },
    select: { sourceId: true },
  });
  const seen = new Set(existing.map((f) => f.sourceId));
  const fresh = all.filter((f) => f.sourceId && !seen.has(f.sourceId));
  console.log(`CoFID seed: ${all.length} in file, ${fresh.length} new to insert.`);

  const CHUNK = 500; // keeps well under Postgres parameter limits
  let total = 0;
  for (let i = 0; i < fresh.length; i += CHUNK) {
    const batch = fresh.slice(i, i + CHUNK);
    await db.food.createMany({ data: batch, skipDuplicates: true });
    total += batch.length;
    console.log(`CoFID seed: +${batch.length} (total ${total}/${fresh.length})`);
  }
  console.log(`CoFID seed finished. Imported ${total} foods.`);
}

/* ------------------------------- routes ------------------------------- */

// GET /api/foods - list with pagination
foodsRouter.get("/", async (c) => {
  const skip = Number(c.req.query("skip")) || 0;
  const take = Math.min(Number(c.req.query("take")) || 50, 100);
  const foods = await db.food.findMany({
    skip, take,
    select: {
      id: true, name: true, brand: true, servingSize: true, servingUnit: true,
      category: true, image: true, calories: true, protein: true,
      carbohydrates: true, fat: true, fiber: true,
    },
  });
  const total = await db.food.count();
  return c.json({ foods, pagination: { skip, take, total } });
});

// GET /api/foods/barcode/:barcode - DB first, then Open Food Facts (auto-caches)
foodsRouter.get("/barcode/:barcode", async (c) => {
  const barcode = c.req.param("barcode");
  let food = await db.food.findUnique({ where: { barcode } });

  if (!food) {
    let off: any;
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
        { headers: { "User-Agent": OFF_USER_AGENT } }
      );
      off = await res.json();
    } catch {
      return c.json({ error: "Could not reach Open Food Facts" }, 502);
    }
    if (off.status !== 1 || !off.product) {
      return c.json({ error: "Food not found" }, 404);
    }
    food = await db.food.upsert({
      where: { barcode },
      update: {},
      create: mapOffToFood(off.product, barcode),
    });
  }

  return c.json({ food: toNumeric(food) });
});

// GET /api/foods/search - all query words must match (any order) in name or brand.
// This makes "sea bass" match CoFID's inverted "Bass, sea, flesh only, raw".
foodsRouter.get("/search", async (c) => {
  const query = (c.req.query("q") || "").trim();
  const category = c.req.query("category");
  if (!query && !category) {
    return c.json({ error: "Please provide a search query or category" }, 400);
  }

  const words = query.split(/\s+/).filter(Boolean);

  const where: any = {};
  if (words.length) {
    where.AND = words.map((w) => ({
      OR: [
        { name: { contains: w, mode: "insensitive" } },
        { brand: { contains: w, mode: "insensitive" } },
      ],
    }));
  }
  if (category) where.category = category;

  const foods = await db.food.findMany({
    where,
    take: 50,
    select: {
      id: true, name: true, brand: true, servingSize: true, servingUnit: true,
      category: true, image: true, calories: true, protein: true,
      carbohydrates: true, fat: true, fiber: true,
    },
  });
  return c.json({ foods });
});

// GET /api/foods/seed-usda - ONE-TIME import. MUST stay above "/:id".
foodsRouter.get("/seed-usda", (c) => {
  const secret = c.req.query("secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) return c.json({ error: "FDC_API_KEY not set" }, 500);
  runUsdaSeed(apiKey).catch((e) => console.error("USDA seed crashed:", e));
  return c.json({ status: "started", note: "Watch Render logs for progress." });
});

// GET /api/foods/seed-cofid - ONE-TIME import of UK CoFID generic foods.
// Reuses SEED_SECRET. MUST stay above "/:id".
foodsRouter.get("/seed-cofid", (c) => {
  const secret = c.req.query("secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return c.json({ error: "Forbidden" }, 403);
  }
  runCofidSeed().catch((e) => console.error("CoFID seed crashed:", e));
  return c.json({ status: "started", note: "Watch Render logs for progress." });
});

// GET /api/foods/:id - single food (keep AFTER the specific routes above)
foodsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const food = await db.food.findUnique({ where: { id } });
  if (!food) return c.json({ error: "Food not found" }, 404);
  return c.json({ food: toNumeric(food) });
});

// POST /api/foods - create (upsert by barcode)
const foodSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  servingSize: z.number().positive(),
  servingUnit: z.string(),
  category: z.string(),
  image: z.string().url().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbohydrates: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  sugar: z.number().min(0),
  vitaminA: z.number().min(0).default(0),
  vitaminB1: z.number().min(0).default(0),
  vitaminB2: z.number().min(0).default(0),
  vitaminB3: z.number().min(0).default(0),
  vitaminB5: z.number().min(0).default(0),
  vitaminB6: z.number().min(0).default(0),
  vitaminB7: z.number().min(0).default(0),
  vitaminB9: z.number().min(0).default(0),
  vitaminB12: z.number().min(0).default(0),
  vitaminC: z.number().min(0).default(0),
  vitaminD: z.number().min(0).default(0),
  vitaminE: z.number().min(0).default(0),
  vitaminK: z.number().min(0).default(0),
  calcium: z.number().min(0).default(0),
  iron: z.number().min(0).default(0),
  magnesium: z.number().min(0).default(0),
  phosphorus: z.number().min(0).default(0),
  potassium: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  zinc: z.number().min(0).default(0),
  copper: z.number().min(0).default(0),
  manganese: z.number().min(0).default(0),
  selenium: z.number().min(0).default(0),
  chromium: z.number().min(0).default(0),
  iodine: z.number().min(0).default(0),
});

foodsRouter.post("/", zValidator("json", foodSchema), async (c) => {
  const data = c.req.valid("json");
  if (data.barcode) {
    const food = await db.food.upsert({
      where: { barcode: data.barcode },
      create: data,
      update: {},
    });
    return c.json({ success: true, food }, 201);
  }
  const food = await db.food.create({ data });
  return c.json({ success: true, food }, 201);
});

export { foodsRouter };

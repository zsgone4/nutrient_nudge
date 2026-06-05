// backend/src/routes/foods.ts
import { Hono } from "hono";
import { db } from "../db";

const foodsRouter = new Hono();

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

/* ---------------------- Open Food Facts (barcode lookup) ---------------------- */

const OFF_USER_AGENT = "NutrientNudge/1.0 (your-email@example.com)";

function gToMg(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : n * 1000;
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

foodsRouter.get("/barcode/:barcode", async (c) => {
  const barcode = c.req.param("barcode");
  const cached = await db.food.findUnique({ where: { barcode } });
  if (cached) return c.json({ source: "cache", food: cached });

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
    return c.json({ error: "No food found for that barcode" }, 404);
  }

  const food = await db.food.upsert({
    where: { barcode },
    update: {},
    create: mapOffToFood(off.product, barcode),
  });
  return c.json({ source: "openfoodfacts", food });
});

/* -------------------------------- name search -------------------------------- */

foodsRouter.get("/search", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 2) return c.json({ foods: [] });
  const results = await db.food.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    take: 25,
    orderBy: { name: "asc" },
  });
  return c.json({ foods: results });
});

/* ---------------------- USDA bulk import (one-time seed) ---------------------- */

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

export { foodsRouter };

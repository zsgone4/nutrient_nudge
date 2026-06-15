// backend/src/lib/micronutrient-matching.ts
//
// Guarantees every usable food carries a micronutrient profile.
// Food.microStatus is one of:
//   MEASURED — real composition data (CoFID / USDA), or rich enough on its own
//   PROXY    — micronutrients borrowed from a similar MEASURED food (same category)
//   NONE     — no data and no safe proxy → should be hidden / blocked
//
// Only MICRONUTRIENTS are ever borrowed. calories/protein/carbohydrates/fat/
// fiber/sugar always stay the food's own values. Everything is per-100g
// (servingSize is 100 for imported foods), so the app keeps scaling by grams
// at log time exactly as it does now.

import { db } from "../db";

// --- field definitions (must match schema.prisma exactly) ---

// Vitamins + minerals copied from a donor when proxying.
const MICRO_FIELDS = [
  "vitaminA", "vitaminB1", "vitaminB2", "vitaminB3", "vitaminB5", "vitaminB6",
  "vitaminB7", "vitaminB9", "vitaminB12", "vitaminC", "vitaminD", "vitaminE", "vitaminK",
  "calcium", "iron", "magnesium", "phosphorus", "potassium", "sodium", "zinc",
  "copper", "manganese", "selenium", "chromium", "iodine",
] as const;

// Core set used to judge whether a food is "measured enough" on its own.
// Sodium is deliberately excluded — packaged foods often have ONLY sodium,
// which would otherwise look like a real profile.
const CORE_MICROS = [
  "calcium", "iron", "magnesium", "potassium", "zinc",
  "vitaminA", "vitaminC", "vitaminB6", "vitaminB9", "vitaminB12",
] as const;

// Sources treated as authoritative composition data (the donor pool).
const MEASURED_SOURCES = ["usda", "cofid"];

// Tunable "fake-safe" thresholds. Raise minDonorScore to be stricter.
export const MATCH_DEFAULTS = {
  minCoreForMeasured: 6, // ≥6 of 10 core micros present → measured on its own
  minDonorScore: 0.45,   // best donor below this → food becomes NONE (excluded)
};

export type MicroStatus = "MEASURED" | "PROXY" | "NONE";

// --- helpers ---

function val(food: any, key: string): number | null {
  const n = Number(food?.[key]);
  return Number.isFinite(n) ? n : null;
}

// Treats null AND 0 as "no data" (POST defaults micros to 0, so a stored 0
// can't be trusted to mean a real measurement).
function corePresentCount(food: any): number {
  let count = 0;
  for (const k of CORE_MICROS) {
    const n = val(food, k);
    if (n !== null && n > 0) count++;
  }
  return count;
}

const STOPWORDS = new Set([
  "the", "and", "with", "raw", "fresh", "cooked", "boiled", "organic",
  "natural", "plain", "whole", "flesh", "only", "new", "style",
]);

function tokens(name: string): Set<string> {
  return new Set(
    (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Macro distance → 0..1 similarity (per 100g). 1 = identical.
function macroSimilarity(a: any, b: any): number {
  const fields: Array<[string, number]> = [
    ["calories", 400], ["protein", 50], ["carbohydrates", 50], ["fat", 50],
  ];
  let sumSq = 0;
  let count = 0;
  for (const [f, scale] of fields) {
    const av = val(a, f);
    const bv = val(b, f);
    if (av === null || bv === null) continue;
    const d = (av - bv) / scale;
    sumSq += d * d;
    count++;
  }
  if (count === 0) return 0;
  return 1 / (1 + Math.sqrt(sumSq / count));
}

export function scoreDonor(target: any, donor: any): number {
  const nameScore = jaccard(tokens(target.name), tokens(donor.name));
  const macroScore = macroSimilarity(target, donor);
  return 0.55 * nameScore + 0.45 * macroScore;
}

// --- pure classification (used by both single-resolve and backfill) ---

function measuredData() {
  return { microStatus: "MEASURED" as MicroStatus, microProxyFoodId: null, microMatchName: null, microMatchScore: null };
}
function noneData() {
  return { microStatus: "NONE" as MicroStatus, microProxyFoodId: null, microMatchName: null, microMatchScore: null };
}
function proxyData(donor: any, score: number) {
  const data: any = {
    microStatus: "PROXY" as MicroStatus,
    microProxyFoodId: donor.id,
    microMatchName: donor.name,
    microMatchScore: Math.round(score * 100) / 100,
  };
  for (const k of MICRO_FIELDS) data[k] = donor[k] ?? null; // micros only
  return data;
}

export interface ClassifyResult {
  status: MicroStatus;
  data: Record<string, any>;
  donorName?: string;
  score?: number;
}

// `donors` must already be source-trusted foods in the SAME category.
export function classify(
  food: any,
  donors: any[],
  cfg: typeof MATCH_DEFAULTS = MATCH_DEFAULTS
): ClassifyResult {
  const trusted =
    (food.source && MEASURED_SOURCES.includes(food.source)) ||
    corePresentCount(food) >= cfg.minCoreForMeasured;
  if (trusted) return { status: "MEASURED", data: measuredData() };

  let best: any = null;
  let bestScore = -1;
  for (const c of donors) {
    if (c.id === food.id) continue;
    const s = scoreDonor(food, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }

  if (best && bestScore >= cfg.minDonorScore) {
    return { status: "PROXY", data: proxyData(best, bestScore), donorName: best.name, score: bestScore };
  }
  return { status: "NONE", data: noneData() };
}

// --- single food: call after creating / upserting a food ---

export async function resolveFoodMicros(
  foodId: string,
  opts: Partial<typeof MATCH_DEFAULTS> = {}
): Promise<ClassifyResult> {
  const cfg = { ...MATCH_DEFAULTS, ...opts };
  const food = await db.food.findUnique({ where: { id: foodId } });
  if (!food) return { status: "NONE", data: noneData() };

  const donors = await db.food.findMany({
    where: { category: food.category, source: { in: MEASURED_SOURCES }, id: { not: foodId } },
    take: 1000,
  });

  const result = classify(food, donors, cfg);
  await db.food.update({ where: { id: foodId }, data: result.data });
  return result;
}

// --- one-time backfill over the whole table (cursor-based, idempotent) ---
// The route in foods.ts will call this in a loop until `done` is true.

export async function backfillMicros(afterId: string | null, batchSize = 200) {
  const foods = await db.food.findMany({
    where: afterId ? { id: { gt: afterId } } : {},
    orderBy: { id: "asc" },
    take: batchSize,
  });

  if (foods.length === 0) {
    return { processed: 0, lastId: null as string | null, measured: 0, proxy: 0, none: 0, done: true };
  }

  // Preload the source-trusted donor pool for each category in this batch.
  const categories = [...new Set(foods.map((f) => f.category))];
  const donorsByCategory = new Map<string, any[]>();
  for (const cat of categories) {
    donorsByCategory.set(
      cat,
      await db.food.findMany({ where: { category: cat, source: { in: MEASURED_SOURCES } } })
    );
  }

  const counts = { measured: 0, proxy: 0, none: 0 };
  for (const food of foods) {
    const result = classify(food, donorsByCategory.get(food.category) ?? []);
    await db.food.update({ where: { id: food.id }, data: result.data });
    counts[result.status.toLowerCase() as "measured" | "proxy" | "none"]++;
  }

  return {
    processed: foods.length,
    lastId: foods[foods.length - 1].id,
    ...counts,
    done: foods.length < batchSize,
  };
}

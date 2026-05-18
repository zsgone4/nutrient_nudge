import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import Anthropic from "@anthropic-ai/sdk";

const aiRouter = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const zachSchema = z.object({
  totals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbohydrates: z.number(),
    fat: z.number(),
    fiber: z.number(),
    sugar: z.number(),
  }),
  goals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbohydrates: z.number(),
    fat: z.number(),
    fiber: z.number(),
    sugar: z.number(),
  }),
  micros: z.record(z.string(), z.number()),
  microGoals: z.record(z.string(), z.number()),
  meals: z.array(z.string()),
  userName: z.string().optional(),
});

// POST /api/ai/zach — get AI nutrition advice
aiRouter.post("/zach", zValidator("json", zachSchema), async (c) => {
  const { totals, goals, micros, microGoals, meals, userName } = c.req.valid("json");

  const calPct = goals.calories > 0 ? Math.round((totals.calories / goals.calories) * 100) : 0;
  const protPct = goals.protein > 0 ? Math.round((totals.protein / goals.protein) * 100) : 0;

  // Find top deficiencies
  const microNames: Record<string, string> = {
    vitaminA: "Vitamin A", vitaminB1: "Vitamin B1 (Thiamine)", vitaminB2: "Vitamin B2 (Riboflavin)",
    vitaminB3: "Vitamin B3 (Niacin)", vitaminB5: "Vitamin B5", vitaminB6: "Vitamin B6",
    vitaminB7: "Vitamin B7 (Biotin)", vitaminB9: "Vitamin B9 (Folate)", vitaminB12: "Vitamin B12",
    vitaminC: "Vitamin C", vitaminD: "Vitamin D", vitaminE: "Vitamin E", vitaminK: "Vitamin K",
    calcium: "Calcium", iron: "Iron", magnesium: "Magnesium", phosphorus: "Phosphorus",
    potassium: "Potassium", sodium: "Sodium", zinc: "Zinc", copper: "Copper",
    manganese: "Manganese", selenium: "Selenium", chromium: "Chromium", iodine: "Iodine",
  };

  const microFoods: Record<string, string[]> = {
    vitaminA: ["sweet potato", "carrots", "spinach", "kale", "eggs"],
    vitaminB1: ["pork", "sunflower seeds", "oats", "legumes"],
    vitaminB2: ["dairy products", "eggs", "almonds", "leafy greens"],
    vitaminB3: ["chicken breast", "tuna", "turkey", "mushrooms", "peanuts"],
    vitaminB5: ["chicken", "avocado", "sunflower seeds", "mushrooms"],
    vitaminB6: ["salmon", "chicken", "potatoes", "bananas", "chickpeas"],
    vitaminB7: ["eggs", "almonds", "sweet potato", "salmon", "avocado"],
    vitaminB9: ["spinach", "asparagus", "lentils", "avocado", "broccoli"],
    vitaminB12: ["salmon", "tuna", "beef", "eggs", "dairy", "sardines"],
    vitaminC: ["bell peppers", "strawberries", "kiwi", "broccoli", "citrus fruits"],
    vitaminD: ["salmon", "mackerel", "eggs", "fortified milk", "sardines"],
    vitaminE: ["almonds", "sunflower seeds", "spinach", "avocado", "olive oil"],
    vitaminK: ["kale", "spinach", "broccoli", "Brussels sprouts", "parsley"],
    calcium: ["dairy products", "tofu", "sardines", "kale", "fortified plant milks"],
    iron: ["red meat", "lentils", "spinach", "pumpkin seeds", "tofu"],
    magnesium: ["pumpkin seeds", "dark chocolate", "spinach", "almonds", "avocado"],
    phosphorus: ["salmon", "dairy", "chicken", "lentils", "pumpkin seeds"],
    potassium: ["banana", "sweet potato", "avocado", "spinach", "salmon"],
    sodium: ["most foods contain sodium"],
    zinc: ["oysters", "beef", "pumpkin seeds", "chickpeas", "cashews"],
    copper: ["beef liver", "oysters", "cashews", "dark chocolate", "sesame seeds"],
    manganese: ["brown rice", "oats", "hazelnuts", "spinach", "pineapple"],
    selenium: ["Brazil nuts", "tuna", "salmon", "chicken", "eggs"],
    chromium: ["broccoli", "whole grains", "green beans", "beef"],
    iodine: ["seaweed", "cod", "dairy products", "eggs", "iodised salt"],
  };

  const deficiencies = Object.entries(micros)
    .map(([key, val]) => {
      const goal = microGoals[key] ?? 0;
      if (!goal) return null;
      const pct = (val / goal) * 100;
      return { key, name: microNames[key] ?? key, pct, foodSuggestions: microFoods[key] ?? [] };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null && d.pct < 50)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  const name = userName ?? "there";
  const mealsLogged = meals.filter(Boolean).join(", ") || "nothing yet";

  const prompt = `You are Zach, a friendly AI nutritionist. Respond in 3-4 short, punchy sentences max — no bullet points, no headers, just warm conversational text.

Today's data for ${name}:
- Calories: ${totals.calories} of ${goals.calories} goal (${calPct}%)
- Protein: ${totals.protein}g of ${goals.protein}g (${protPct}%)
- Carbs: ${totals.carbohydrates}g, Fat: ${totals.fat}g, Fiber: ${totals.fiber}g
- Meals logged: ${mealsLogged}
- Top deficiencies (under 50% of daily target): ${deficiencies.length > 0 ? deficiencies.map(d => `${d.name} (${Math.round(d.pct)}%)`).join(", ") : "none — great day!"}
${deficiencies.length > 0 ? `- Best foods to fix deficiencies: ${deficiencies.map(d => `${d.name}: try ${d.foodSuggestions.slice(0,2).join(" or ")}`).join("; ")}` : ""}

Give personalised feedback: how they're doing vs their goals, what they're missing, and 1-2 specific food recommendations to fill the gaps. Be upbeat, specific, and actionable.`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.type === "text"
      ? message.content[0].text
      : "Great work today! Keep logging your meals for personalised insights.";

    return c.json({ message: text, deficiencies });
  } catch (err) {
    console.error("Zach AI error:", err);
    return c.json({
      message: calPct < 30
        ? `Hey ${name}! You've barely started logging today — every meal you track brings you closer to your goal. Start with a good meal and check back for insights!`
        : `You're at ${calPct}% of your calorie goal with ${totals.protein}g protein. ${deficiencies.length > 0 ? `Focus on boosting ${deficiencies[0]?.name ?? "your micronutrients"} — try adding ${deficiencies[0]?.foodSuggestions[0] ?? "more vegetables"} to your next meal.` : "You're hitting your targets well today!"}`,
      deficiencies,
    });
  }
});

export { aiRouter };

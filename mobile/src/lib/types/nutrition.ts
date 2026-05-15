// Comprehensive nutrition types for tracking calories and micronutrients

export interface Macronutrients {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
}

export interface Micronutrients {
  // Vitamins (in mg unless specified)
  vitaminA: number; // mcg RAE
  vitaminB1: number; // mg (Thiamin)
  vitaminB2: number; // mg (Riboflavin)
  vitaminB3: number; // mg (Niacin)
  vitaminB5: number; // mg (Pantothenic Acid)
  vitaminB6: number; // mg
  vitaminB7: number; // mcg (Biotin)
  vitaminB9: number; // mcg (Folate)
  vitaminB12: number; // mcg
  vitaminC: number; // mg
  vitaminD: number; // mcg
  vitaminE: number; // mg
  vitaminK: number; // mcg

  // Minerals (in mg unless specified)
  calcium: number;
  iron: number;
  magnesium: number;
  phosphorus: number;
  potassium: number;
  sodium: number;
  zinc: number;
  copper: number; // mg
  manganese: number; // mg
  selenium: number; // mcg
  chromium: number; // mcg
  iodine: number; // mcg
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: number; // grams
  servingUnit: string;
  macros: Macronutrients;
  micros: Micronutrients;
  category: FoodCategory;
  image?: string;
}

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'protein'
  | 'dairy'
  | 'fats'
  | 'snacks'
  | 'beverages'
  | 'prepared';

export interface FoodLogEntry {
  id: string;
  food: Food;
  servings: number;
  mealType: MealType;
  timestamp: number;
  date: string; // YYYY-MM-DD format
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DailyGoals {
  macros: Macronutrients;
  micros: Micronutrients;
}

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'aggressive_cut' | 'conservative_cut' | 'maintain' | 'conservative_bulk' | 'aggressive_bulk';

export interface UserProfile {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: Goal;
  isSetup: boolean;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  aggressive_cut: -0.25,
  conservative_cut: -0.10,
  maintain: 0,
  conservative_bulk: 0.10,
  aggressive_bulk: 0.25,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little exercise)',
  light: 'Light (1-3 days/week)',
  moderate: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very Active (intense daily)',
};

export const GOAL_LABELS: Record<Goal, { title: string; description: string }> = {
  aggressive_cut: { title: 'Aggressive Cut', description: '-25% for rapid loss' },
  conservative_cut: { title: 'Steady Cut', description: '-10% for consistent loss' },
  maintain: { title: 'Maintain', description: 'Keep current weight' },
  conservative_bulk: { title: 'Lean Bulk', description: '+10% for lean gains' },
  aggressive_bulk: { title: 'Aggressive Bulk', description: '+25% for rapid gains' },
};

export interface DailyLog {
  date: string;
  entries: FoodLogEntry[];
  totals: {
    macros: Macronutrients;
    micros: Micronutrients;
  };
}

// Recommended Daily Values (RDV) for adults
export const DAILY_VALUES: { macros: Macronutrients; micros: Micronutrients } = {
  macros: {
    calories: 2000,
    protein: 50,
    carbohydrates: 275,
    fat: 78,
    fiber: 28,
    sugar: 50,
  },
  micros: {
    vitaminA: 900,
    vitaminB1: 1.2,
    vitaminB2: 1.3,
    vitaminB3: 16,
    vitaminB5: 5,
    vitaminB6: 1.7,
    vitaminB7: 30,
    vitaminB9: 400,
    vitaminB12: 2.4,
    vitaminC: 90,
    vitaminD: 20,
    vitaminE: 15,
    vitaminK: 120,
    calcium: 1000,
    iron: 18,
    magnesium: 420,
    phosphorus: 700,
    potassium: 4700,
    sodium: 2300,
    zinc: 11,
    copper: 0.9,
    manganese: 2.3,
    selenium: 55,
    chromium: 35,
    iodine: 150,
  },
};

// Micronutrient display info
export const MICRONUTRIENT_INFO: Record<keyof Micronutrients, { name: string; unit: string; category: string; description: string; tooLittle: string; enough: string; tooMuch: string }> = {
  vitaminA: {
    name: 'Vitamin A', unit: 'mcg', category: 'Fat-Soluble Vitamins',
    description: 'Essential for vision, immune defence, and skin renewal.',
    tooLittle: 'Night blindness, weakened immunity, and dry flaking skin.',
    enough: 'Sharp vision, strong immune defences, and healthy glowing skin.',
    tooMuch: 'Liver damage, bone loss, and birth defects at very high doses.',
  },
  vitaminB1: {
    name: 'Vitamin B1', unit: 'mg', category: 'B Vitamins',
    description: 'Thiamin — converts carbohydrates into usable energy for nerves and muscles.',
    tooLittle: 'Fatigue, nerve damage, and heart problems (beriberi).',
    enough: 'Steady energy from carbs and healthy nerve and heart function.',
    tooMuch: 'Generally safe — kidneys excrete excess thiamin.',
  },
  vitaminB2: {
    name: 'Vitamin B2', unit: 'mg', category: 'B Vitamins',
    description: 'Riboflavin — powers cellular energy production and protects eyes and skin.',
    tooLittle: 'Cracked lips, sore throat, and sensitivity to light.',
    enough: 'Healthy skin, sharp eyes, and efficient energy at the cellular level.',
    tooMuch: 'Generally safe — excess is flushed out in urine (causes bright yellow colour).',
  },
  vitaminB3: {
    name: 'Vitamin B3', unit: 'mg', category: 'B Vitamins',
    description: 'Niacin — supports digestion, skin integrity, and nervous system function.',
    tooLittle: 'Pellagra: dermatitis, diarrhoea, and dementia in severe cases.',
    enough: 'Healthy digestion, clear skin, and well-functioning nerves.',
    tooMuch: 'Skin flushing, nausea, and liver damage at high supplement doses.',
  },
  vitaminB5: {
    name: 'Vitamin B5', unit: 'mg', category: 'B Vitamins',
    description: 'Pantothenic Acid — critical for synthesising hormones and metabolising nutrients.',
    tooLittle: 'Fatigue, irritability, and tingling in hands and feet (rare).',
    enough: 'Optimal hormone synthesis and smooth nutrient metabolism throughout the day.',
    tooMuch: 'Generally safe — excess rarely causes problems.',
  },
  vitaminB6: {
    name: 'Vitamin B6', unit: 'mg', category: 'B Vitamins',
    description: 'Supports brain chemistry, mood regulation, and a strong immune response.',
    tooLittle: 'Anaemia, depression, confusion, and weakened immunity.',
    enough: 'Sharp brain function, balanced mood, and a resilient immune system.',
    tooMuch: 'Nerve damage (neuropathy) with prolonged high-dose supplementation.',
  },
  vitaminB7: {
    name: 'Vitamin B7', unit: 'mcg', category: 'B Vitamins',
    description: 'Biotin — key for hair, nail, and skin health, plus fat and carb metabolism.',
    tooLittle: 'Hair thinning, brittle nails, and scaly skin rashes.',
    enough: 'Strong, thick hair, clear skin, and healthy nails.',
    tooMuch: 'Generally safe from food; high-dose supplements can skew lab test results.',
  },
  vitaminB9: {
    name: 'Vitamin B9', unit: 'mcg', category: 'B Vitamins',
    description: 'Folate — essential for cell division, DNA repair, and healthy pregnancy.',
    tooLittle: 'Anaemia, fatigue, and neural tube defects in early pregnancy.',
    enough: 'Healthy cell division, strong DNA repair, and vital protection during pregnancy.',
    tooMuch: 'High doses can mask B12 deficiency and may fuel pre-existing tumour growth.',
  },
  vitaminB12: {
    name: 'Vitamin B12', unit: 'mcg', category: 'B Vitamins',
    description: 'Powers red blood cell formation, nerve insulation, and memory.',
    tooLittle: 'Fatigue, nerve damage, memory problems, and megaloblastic anaemia.',
    enough: 'Healthy red blood cells, sharp memory, and strong nerve function.',
    tooMuch: 'Generally safe — body stores or excretes excess.',
  },
  vitaminC: {
    name: 'Vitamin C', unit: 'mg', category: 'Water-Soluble Vitamins',
    description: 'Powerful antioxidant that builds collagen, heals wounds, and boosts immunity.',
    tooLittle: 'Scurvy: bleeding gums, extreme fatigue, and slow wound healing.',
    enough: 'Robust immunity, fast tissue repair, and antioxidant protection against cell damage.',
    tooMuch: 'Digestive upset and increased kidney stone risk at very high doses.',
  },
  vitaminD: {
    name: 'Vitamin D', unit: 'mcg', category: 'Fat-Soluble Vitamins',
    description: 'The "sunshine vitamin" — essential for bones, mood, and immune regulation.',
    tooLittle: 'Soft bones (rickets/osteomalacia), low mood, and impaired immune function.',
    enough: 'Dense bones, lifted mood, and a well-regulated immune system.',
    tooMuch: 'Calcium buildup causing nausea, kidney damage, and irregular heart rhythm.',
  },
  vitaminE: {
    name: 'Vitamin E', unit: 'mg', category: 'Fat-Soluble Vitamins',
    description: 'Fat-soluble antioxidant that protects cells, skin, and immune cells.',
    tooLittle: 'Nerve damage, muscle weakness, and impaired immune response.',
    enough: 'Powerful antioxidant protection, healthy skin, and strong immune function.',
    tooMuch: 'Increased bleeding risk; can interfere with vitamin K at high doses.',
  },
  vitaminK: {
    name: 'Vitamin K', unit: 'mcg', category: 'Fat-Soluble Vitamins',
    description: 'Controls blood clotting and helps lay down calcium in bones.',
    tooLittle: 'Excessive bleeding and poor bone mineralisation.',
    enough: 'Proper blood clotting and strong, dense bones.',
    tooMuch: 'Generally safe from food; high doses can interact with blood-thinning medications.',
  },
  calcium: {
    name: 'Calcium', unit: 'mg', category: 'Major Minerals',
    description: 'The most abundant mineral in the body — builds bones and enables muscle contractions.',
    tooLittle: 'Weak bones (osteoporosis), muscle cramps, and abnormal heart rhythm.',
    enough: 'Dense strong bones, smooth muscle contractions, and healthy nerve signalling.',
    tooMuch: 'Kidney stones, constipation, and may impair iron and zinc absorption.',
  },
  iron: {
    name: 'Iron', unit: 'mg', category: 'Trace Minerals',
    description: 'Carries oxygen in red blood cells to every tissue in your body.',
    tooLittle: 'Iron-deficiency anaemia: fatigue, pale skin, and shortness of breath.',
    enough: 'Efficient oxygen transport, high energy levels, and a strong immune response.',
    tooMuch: 'Organ damage (liver, heart) and oxidative stress at chronically high levels.',
  },
  magnesium: {
    name: 'Magnesium', unit: 'mg', category: 'Major Minerals',
    description: 'Involved in 300+ enzyme reactions — from sleep to blood sugar to heartbeat.',
    tooLittle: 'Muscle cramps, poor sleep, anxiety, and irregular heartbeat.',
    enough: 'Relaxed muscles, restful sleep, stable blood sugar, and calm nerves.',
    tooMuch: 'Diarrhoea and low blood pressure; dangerous mainly with kidney disease.',
  },
  phosphorus: {
    name: 'Phosphorus', unit: 'mg', category: 'Major Minerals',
    description: 'Pairs with calcium to build bones and powers cellular energy (ATP).',
    tooLittle: 'Bone pain, muscle weakness, and impaired cellular energy (rare).',
    enough: 'Strong bones, efficient energy storage, and healthy cell membranes.',
    tooMuch: 'Can weaken bones by disrupting calcium balance at very high intake.',
  },
  potassium: {
    name: 'Potassium', unit: 'mg', category: 'Major Minerals',
    description: 'Regulates heart rhythm, blood pressure, and muscle contractions.',
    tooLittle: 'Muscle cramps, fatigue, constipation, and elevated blood pressure.',
    enough: 'Healthy heart rhythm, lower blood pressure, and strong muscle function.',
    tooMuch: 'Irregular heartbeat; dangerous mainly with kidney disease or high-dose supplements.',
  },
  sodium: {
    name: 'Sodium', unit: 'mg', category: 'Major Minerals',
    description: 'Regulates fluid balance and enables nerve and muscle signalling.',
    tooLittle: 'Headaches, nausea, confusion, and dangerously low blood pressure.',
    enough: 'Proper fluid balance, nerve signalling, and muscle contractions.',
    tooMuch: 'High blood pressure and significantly increased stroke and heart disease risk.',
  },
  zinc: {
    name: 'Zinc', unit: 'mg', category: 'Trace Minerals',
    description: 'Powers immune cells, wound repair, and your sense of taste and smell.',
    tooLittle: 'Impaired immunity, slow wound healing, and loss of taste and smell.',
    enough: 'Fast wound healing, sharp senses, and a robust immune system.',
    tooMuch: 'Nausea, reduced immunity, and copper deficiency at high doses.',
  },
  copper: {
    name: 'Copper', unit: 'mg', category: 'Trace Minerals',
    description: 'Supports iron absorption, connective tissue formation, and nerve coating.',
    tooLittle: 'Anaemia, weak bones, and neurological problems.',
    enough: 'Healthy iron metabolism, strong connective tissue, and protected nerves.',
    tooMuch: 'Liver damage and nausea; especially dangerous in Wilson\'s disease.',
  },
  manganese: {
    name: 'Manganese', unit: 'mg', category: 'Trace Minerals',
    description: 'Activates enzymes for bone formation, metabolism, and antioxidant defence.',
    tooLittle: 'Poor bone formation and impaired glucose metabolism (rare).',
    enough: 'Strong bones, efficient metabolism, and antioxidant enzyme support.',
    tooMuch: 'Neurological symptoms (similar to Parkinson\'s) at very high chronic exposure.',
  },
  selenium: {
    name: 'Selenium', unit: 'mcg', category: 'Trace Minerals',
    description: 'Protects thyroid hormones and defends cells against oxidative damage.',
    tooLittle: 'Weakened thyroid function and poor antioxidant defence.',
    enough: 'Optimal thyroid hormone production and strong antioxidant protection.',
    tooMuch: 'Hair loss, brittle nails, and fatigue (selenosis) at excess doses.',
  },
  chromium: {
    name: 'Chromium', unit: 'mcg', category: 'Trace Minerals',
    description: 'Enhances insulin action to keep blood sugar stable after meals.',
    tooLittle: 'Impaired insulin sensitivity and blood sugar swings (rare).',
    enough: 'Healthy blood sugar regulation and efficient carbohydrate metabolism.',
    tooMuch: 'Liver and kidney damage with high-dose supplements.',
  },
  iodine: {
    name: 'Iodine', unit: 'mcg', category: 'Trace Minerals',
    description: 'The building block of thyroid hormones that control your metabolic rate.',
    tooLittle: 'Hypothyroidism, goitre, and developmental issues in pregnancy.',
    enough: 'Well-functioning thyroid and a steady, healthy metabolic rate.',
    tooMuch: 'Thyroid dysfunction — both excess and deficiency disrupt hormone balance.',
  },
};

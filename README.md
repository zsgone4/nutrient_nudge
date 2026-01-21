# NutriTrack - Smart Nutrition Tracking App

A comprehensive calorie and micronutrient tracking app that goes beyond basic food logging with intelligent recommendations, detailed vitamin/mineral tracking, and personalized calorie goals.

## Features

### Dashboard
- Daily calorie and macro overview with circular progress indicators
- Real-time tracking of protein, carbs, and fat
- Meal-by-meal breakdown (Breakfast, Lunch, Dinner, Snacks)
- Smart food recommendations based on remaining nutrition needs

### Smart Recommendations
The app analyzes your remaining daily allowances and suggests foods that:
- Fit within your calorie budget
- Help balance your macro ratios
- Address micronutrient deficiencies
- Each recommendation includes reasons (e.g., "High in protein", "Rich in Vitamin B12")

### Micronutrients Tab
Detailed tracking of 26 micronutrients organized by category:
- **B Vitamins**: B1-B12 (Thiamin, Riboflavin, Niacin, etc.)
- **Fat-Soluble Vitamins**: A, D, E, K
- **Water-Soluble Vitamins**: C
- **Major Minerals**: Calcium, Magnesium, Potassium, etc.
- **Trace Minerals**: Iron, Zinc, Selenium, etc.

Each nutrient shows:
- Current vs. goal amounts
- Percentage of daily value
- Status indicators (low/good/high)
- Expandable info with health benefits

### Profile & Calorie Calculator
Personalized calorie targets based on:
- **Personal Stats**: Age, height, weight, sex
- **Activity Level**: Sedentary to Very Active (5 levels)
- **Goal Selection**:
  - Aggressive Cut (-25% calories)
  - Steady Cut (-10% calories)
  - Maintain (maintenance calories)
  - Lean Bulk (+10% calories)
  - Aggressive Bulk (+25% calories)

Uses the Mifflin-St Jeor equation for accurate BMR calculation, then applies activity multipliers and goal adjustments.

### Food Database
Pre-loaded with 35+ common foods including:
- Fruits & Vegetables
- Proteins (meat, fish, eggs, tofu, legumes)
- Dairy products
- Grains & carbs
- Healthy fats & nuts
- Snacks & beverages

Each food includes complete macro and micronutrient data.

## Tech Stack

- Expo SDK 53 + React Native
- Expo Router for navigation
- Zustand for state management (persisted with AsyncStorage)
- NativeWind (Tailwind CSS)
- React Native Reanimated for animations
- Lucide React Native for icons

## Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      # Dashboard
│   │   ├── two.tsx        # Micronutrients
│   │   └── profile.tsx    # Profile & Goals
│   ├── add-food.tsx       # Add food modal
│   └── _layout.tsx        # Root layout
├── components/
│   └── NutritionComponents.tsx
└── lib/
    ├── data/foods.ts      # Food database
    ├── types/nutrition.ts # Type definitions
    ├── state/nutrition-store.ts # Zustand store with calorie calculations
    └── utils/recommendations.ts # Smart recommendations
```

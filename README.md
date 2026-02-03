# NutriTrack - Smart Nutrition Tracking App

A comprehensive calorie and micronutrient tracking app that goes beyond basic food logging with intelligent recommendations, detailed vitamin/mineral tracking, and personalized calorie goals.

## Features

### Dashboard
- Daily calorie and macro overview with circular progress indicators
- Real-time tracking of protein, carbs, and fat
- Meal-by-meal breakdown (Breakfast, Lunch, Dinner, Snacks)
- Smart food recommendations based on micronutrient deficiencies

### Meal Management
- **View meal details**: Tap any meal to see all logged foods
- **Edit portions**: Adjust amounts in grams for any logged food
- **Remove foods**: Delete items you logged by mistake
- All measurements displayed in grams for consistency

### Smart Recommendations
The app prioritizes **micronutrient optimization** and suggests foods that:
- Address your biggest vitamin/mineral deficiencies first
- Show percentage of daily value each food provides (e.g., "43% Vitamin C")
- Fit within your calorie budget
- Are nutrient-dense (high micronutrients per calorie)
- Each recommendation explains why (e.g., "Rich in 43% Vitamin C, 20% Folate")

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
Pre-loaded with 180+ foods including:
- Fruits & Vegetables
- Proteins (meat, fish, eggs, tofu, legumes)
- Dairy products
- Grains & carbs
- Healthy fats & nuts
- International foods (falafel, sushi, curry, etc.)
- Snacks, desserts & beverages
- Spreads (Marmite, Vegemite, Nutella, etc.)

Each food includes complete macro and micronutrient data with all measurements in grams.

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
│   ├── add-food.tsx       # Add food screen
│   ├── meal-detail.tsx    # View/edit meal foods
│   └── _layout.tsx        # Root layout
├── components/
│   └── NutritionComponents.tsx
└── lib/
    ├── data/foods.ts      # Food database (180+ items)
    ├── types/nutrition.ts # Type definitions
    ├── state/nutrition-store.ts # Zustand store with calorie calculations
    └── utils/recommendations.ts # Micronutrient-focused recommendations
```

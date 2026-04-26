import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { MacroBar, MealCard, CircularProgress } from '@/components/NutritionComponents';
import { MealType, Macronutrients, Micronutrients, FoodLogEntry } from '@/lib/types/nutrition';

const EMPTY_ENTRIES: FoodLogEntry[] = [];

const MEAL_CONFIG: Record<MealType, { label: string; icon: React.ReactNode; color: string }> = {
  breakfast: { label: 'Breakfast', icon: <Coffee size={24} color="#F59E0B" />, color: '#F59E0B' },
  lunch: { label: 'Lunch', icon: <Sun size={24} color="#10B981" />, color: '#10B981' },
  dinner: { label: 'Dinner', icon: <Moon size={24} color="#6366F1" />, color: '#6366F1' },
  snacks: { label: 'Snacks', icon: <Cookie size={24} color="#EC4899" />, color: '#EC4899' },
};

const emptyMacros: Macronutrients = {
  calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0,
};

const emptyMicros: Micronutrients = {
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
  vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
  phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
  selenium: 0, chromium: 0, iodine: 0,
};

type InsightEntry = { outcome: string; messages: string[] };

const ZACH_INSIGHT_MAP: Partial<Record<keyof Micronutrients, InsightEntry>> = {
  magnesium:  { outcome: 'Sleep & Recovery',        messages: ["Great magnesium today — you're primed for deep, restorative sleep tonight.", "Solid magnesium! Expect better muscle recovery and a quality night's rest."] },
  vitaminD:   { outcome: 'Mood & Energy',            messages: ["Strong vitamin D — great for mood, immunity, and keeping energy steady all day.", "Vitamin D covered! Your immune system and energy levels are well supported."] },
  iron:       { outcome: 'Energy & Focus',           messages: ["Good iron today — expect sharper focus and sustained energy with less fatigue.", "Solid iron intake! Your blood oxygen delivery is well supported."] },
  vitaminB12: { outcome: 'Brain & Energy',           messages: ["Excellent B12! Your brain is fuelled for clarity and mental stamina.", "Great vitamin B12 — supports nerve health and keeps your energy metabolism fired up."] },
  calcium:    { outcome: 'Bones & Muscle',           messages: ["Calcium is ticked — strong bones and smooth muscle contractions are supported.", "Good calcium today! Working with vitamin D to keep your skeleton strong."] },
  zinc:       { outcome: 'Immunity & Healing',       messages: ["Nice zinc levels — your immune system is primed and tissue repair is on.", "Solid zinc today! Great for immunity, hormone balance, and faster recovery."] },
  vitaminC:   { outcome: 'Immunity & Skin',          messages: ["Strong vitamin C — immune defences are firing and collagen production is up.", "Great vitamin C! Supports recovery, glowing skin, and your immune response."] },
  potassium:  { outcome: 'Heart & Performance',      messages: ["Good potassium supports heart health and keeps muscles performing at their best.", "Solid potassium today — great for blood pressure and athletic output."] },
  vitaminA:   { outcome: 'Vision & Skin',            messages: ["Nice vitamin A — supporting sharp vision and skin regeneration from within.", "Vitamin A is covered! Keeps eyes, skin, and immune function in top shape."] },
  vitaminB6:  { outcome: 'Mood & Energy',            messages: ["Solid B6 helps regulate mood and keeps your energy metabolism running smoothly.", "Good vitamin B6 — supports serotonin production and converts food into fuel."] },
  selenium:   { outcome: 'Thyroid & Antioxidants',   messages: ["Selenium covered — great for thyroid function and fighting oxidative stress.", "Nice selenium today! Supports your metabolism and acts as a powerful antioxidant."] },
  vitaminE:   { outcome: 'Recovery & Skin',          messages: ["Great vitamin E — a powerful antioxidant that protects cells and speeds recovery.", "Nice vitamin E! Helps shield muscles from exercise-induced stress."] },
  vitaminK:   { outcome: 'Bone & Blood',             messages: ["Good vitamin K — essential for healthy clotting and maintaining bone density.", "Vitamin K solid today! Supports both cardiovascular and bone health."] },
  vitaminB3:  { outcome: 'Energy & Brain',           messages: ["Good niacin (B3) — supports brain function and efficient energy metabolism."] },
  vitaminB9:  { outcome: 'Cell Repair',              messages: ["Nice folate (B9) — key for DNA repair, cell growth, and energy production."] },
};

function getZachInsights(totals: Micronutrients, goals: Micronutrients) {
  const results: Array<{ nutrient: keyof Micronutrients; pct: number; outcome: string; message: string }> = [];

  (Object.keys(ZACH_INSIGHT_MAP) as (keyof Micronutrients)[]).forEach(key => {
    const goal = goals[key];
    if (!goal) return;
    const pct = (totals[key] / goal) * 100;
    if (pct < 60) return;
    const entry = ZACH_INSIGHT_MAP[key]!;
    const msgIdx = pct >= 90 ? 0 : Math.min(1, entry.messages.length - 1);
    results.push({ nutrient: key, pct, outcome: entry.outcome, message: entry.messages[msgIdx] });
  });

  return results.sort((a, b) => b.pct - a.pct).slice(0, 3);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const selectedDate = useNutritionStore(s => s.selectedDate);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const entries = useNutritionStore(s => s.logs[s.selectedDate] ?? EMPTY_ENTRIES);

  const totals = React.useMemo(() => {
    const result = { macros: { ...emptyMacros }, micros: { ...emptyMicros } };
    entries.forEach(entry => {
      const m = entry.servings;
      (Object.keys(result.macros) as (keyof Macronutrients)[]).forEach(k => { result.macros[k] += entry.food.macros[k] * m; });
      (Object.keys(result.micros) as (keyof Micronutrients)[]).forEach(k => { result.micros[k] += entry.food.micros[k] * m; });
    });
    return result;
  }, [entries]);

  const calorieProgress = dailyGoals.macros.calories > 0
    ? totals.macros.calories / dailyGoals.macros.calories
    : 0;

  const zachInsights = React.useMemo(
    () => getZachInsights(totals.micros, dailyGoals.micros),
    [totals.micros, dailyGoals.micros]
  );

  const getMealCalories = (mealType: MealType) =>
    entries.filter(e => e.mealType === mealType).reduce((sum, e) => sum + e.food.macros.calories * e.servings, 0);

  const getMealItemCount = (mealType: MealType) =>
    entries.filter(e => e.mealType === mealType).length;

  const handleViewMeal = (mealType: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/meal-detail', params: { mealType } });
  };

  const handleAddFood = (mealType: MealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/add-food', params: { mealType } });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const dateLabel = isToday ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 80, paddingHorizontal: 20 }}
      >
        <View>
          <Text className="text-white/70 text-sm font-medium mt-4">{dateLabel}</Text>
          <Text className="text-white text-2xl font-bold mt-1">Daily Summary</Text>
        </View>

        <View className="flex-row items-center justify-between mt-6">
          <View className="items-center">
            <CircularProgress
              progress={calorieProgress}
              size={140}
              strokeWidth={12}
              color="#ffffff"
              backgroundColor="rgba(255,255,255,0.25)"
            >
              <Text className="text-3xl font-bold text-white">{Math.round(totals.macros.calories)}</Text>
              <Text className="text-white/70 text-sm">of {dailyGoals.macros.calories}</Text>
            </CircularProgress>
            <Text className="text-white font-medium mt-2">Calories</Text>
          </View>

          <View className="flex-1 ml-6">
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Carbs</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.carbohydrates)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.carbohydrates / (dailyGoals.macros.carbohydrates || 1)) * 100, 100)}%` }} />
              </View>
            </View>
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Protein</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.protein)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.protein / (dailyGoals.macros.protein || 1)) * 100, 100)}%` }} />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Fat</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.fat)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.fat / (dailyGoals.macros.fat || 1)) * 100, 100)}%` }} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-12"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Zach — Nutrient Coach */}
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Zach</Text>
              <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Your Nutrient Coach</Text>
            </View>
          </View>

          {zachInsights.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Log some food and I'll tell you exactly how today's nutrients are setting you up to feel, perform, sleep, and recover. Let's go! 💪
            </Text>
          ) : (
            zachInsights.map((insight, i) => (
              <View
                key={insight.nutrient}
                className={`py-2.5 ${i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}`}
              >
                <View className="flex-row items-start">
                  <View className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 mr-2.5 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
                      {insight.outcome}
                    </Text>
                    <Text className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {insight.message}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Meals */}
        <View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">Meals</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Tap a meal to view or edit, or press + to add food
          </Text>
          {(Object.keys(MEAL_CONFIG) as MealType[]).map((mealType) => {
            const config = MEAL_CONFIG[mealType];
            const calories = Math.round(getMealCalories(mealType));
            const itemCount = getMealItemCount(mealType);
            return (
              <MealCard
                key={mealType}
                title={config.label}
                calories={calories}
                itemCount={itemCount}
                icon={config.icon}
                color={config.color}
                onPress={() => handleViewMeal(mealType)}
                onAddPress={() => handleAddFood(mealType)}
              />
            );
          })}
        </View>

        {/* Detailed Macros */}
        <View className="mt-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Detailed Macros</Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <MacroBar label="Fiber" current={totals.macros.fiber} goal={dailyGoals.macros.fiber} color="#10B981" />
            <MacroBar label="Sugar" current={totals.macros.sugar} goal={dailyGoals.macros.sugar} color="#F59E0B" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coffee, Sun, Moon, Cookie, RefreshCw, X, Bell, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { useUserStore } from '@/lib/state/user-store';
import { MacroBar, MealCard, CircularProgress } from '@/components/NutritionComponents';
import { MealType, Macronutrients, Micronutrients, FoodLogEntry } from '@/lib/types/nutrition';
import { useNotifications } from '@/lib/hooks/useNotifications';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

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

type Deficiency = { key: string; name: string; pct: number; foodSuggestions: string[] };

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reminder, dismissReminder } = useNotifications();

  const selectedDate = useNutritionStore(s => s.selectedDate);
  const setSelectedDate = useNutritionStore(s => s.setSelectedDate);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const calorieGoal = useNutritionStore(s => s.dailyGoals.macros.calories);
  const proteinGoal = useNutritionStore(s => s.dailyGoals.macros.protein);
  const carbsGoal = useNutritionStore(s => s.dailyGoals.macros.carbohydrates);
  const fatGoal = useNutritionStore(s => s.dailyGoals.macros.fat);
  const fiberGoal = useNutritionStore(s => s.dailyGoals.macros.fiber);
  const sugarGoal = useNutritionStore(s => s.dailyGoals.macros.sugar);
  const entries = useNutritionStore(s => s.logs[s.selectedDate] ?? EMPTY_ENTRIES);
  const userGender = useUserStore(s => s.userGender);
  const nutritionistName = userGender === 'female' ? 'Nicole' : 'Noah';

  const [zachMessage, setZachMessage] = useState<string | null>(null);
  const [zachDeficiencies, setZachDeficiencies] = useState<Deficiency[]>([]);
  const [zachLoading, setZachLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const totals = React.useMemo(() => {
    const result = { macros: { ...emptyMacros }, micros: { ...emptyMicros } };
    entries.forEach(entry => {
      const m = entry.servings;
      (Object.keys(result.macros) as (keyof Macronutrients)[]).forEach(k => { result.macros[k] += entry.food.macros[k] * m; });
      (Object.keys(result.micros) as (keyof Micronutrients)[]).forEach(k => { result.micros[k] += entry.food.micros[k] * m; });
    });
    return result;
  }, [entries]);

  const fetchZachInsight = async (currentEntries: FoodLogEntry[], currentTotals: typeof totals) => {
    if (currentEntries.length === 0) return;
    setZachLoading(true);
    try {
      const meals = currentEntries.map(e => e.food.name);
      const res = await fetch(`${BACKEND_URL}/api/ai/zach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totals: currentTotals.macros,
          goals: dailyGoals.macros,
          micros: currentTotals.micros,
          microGoals: dailyGoals.micros,
          meals,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { message: string; deficiencies: Deficiency[] };
        setZachMessage(data.message);
        setZachDeficiencies(data.deficiencies ?? []);
      }
    } catch {
      // silently fail — nutritionist uses fallback message
    } finally {
      setZachLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current && entries.length > 0) {
      hasFetchedRef.current = true;
      fetchZachInsight(entries, totals);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length]);

  const handleRefreshZach = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchZachInsight(entries, totals);
  };

  const calorieProgress = calorieGoal > 0
    ? totals.macros.calories / calorieGoal
    : 0;

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

  const todayString = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayString;
  const dateLabel = isToday ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const goToPrevDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top, paddingBottom: 80, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mt-4">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Daily Summary</Text>
          </View>
          <View className="flex-row items-center bg-white/20 rounded-full px-1 py-1">
            <Pressable onPress={goToPrevDay} className="p-1.5">
              <ChevronLeft size={18} color="white" />
            </Pressable>
            <Text className="text-white text-sm font-semibold mx-2 min-w-16 text-center">{dateLabel}</Text>
            <Pressable onPress={goToNextDay} className="p-1.5">
              <ChevronRight size={18} color="white" />
            </Pressable>
          </View>
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
              <Text className="text-white/70 text-sm">of {calorieGoal}</Text>
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
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.carbohydrates / (carbsGoal || 1)) * 100, 100)}%` }} />
              </View>
            </View>
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Protein</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.protein)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.protein / (proteinGoal || 1)) * 100, 100)}%` }} />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Fat</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.fat)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View className="h-2 bg-white rounded-full" style={{ width: `${Math.min((totals.macros.fat / (fatGoal || 1)) * 100, 100)}%` }} />
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
        {/* Daily Reminder Banner */}
        {reminder && (
          <View
            className="rounded-2xl mb-4 overflow-hidden"
            style={{ backgroundColor: '#065F46' }}
          >
            <LinearGradient
              colors={['#065F46', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16 }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Bell size={16} color="#ffffff" />
              </View>
              <Text className="flex-1 text-white text-sm font-medium leading-snug">{reminder}</Text>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); dismissReminder(); }}
                className="w-7 h-7 rounded-full items-center justify-center ml-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <X size={14} color="#ffffff" />
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Zach AI Nutritionist */}
        <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">{nutritionistName}</Text>
              <Text className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">AI Nutritionist</Text>
            </View>
            {entries.length > 0 && (
              <Pressable
                onPress={handleRefreshZach}
                disabled={zachLoading}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: zachLoading ? '#F3F4F6' : '#ECFDF5' }}
              >
                {zachLoading
                  ? <ActivityIndicator size="small" color="#10B981" />
                  : <RefreshCw size={16} color="#10B981" />
                }
              </Pressable>
            )}
          </View>

          {entries.length === 0 ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Log some food and I'll tell you exactly how today's nutrients are setting you up to feel, perform, sleep, and recover. Let's go! 💪
            </Text>
          ) : zachLoading && !zachMessage ? (
            <View className="flex-row items-center py-2">
              <ActivityIndicator size="small" color="#10B981" />
              <Text className="text-sm text-gray-500 dark:text-gray-400 ml-3">Analysing your nutrition...</Text>
            </View>
          ) : zachMessage ? (
            <View>
              <Text className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {zachMessage}
              </Text>
              {zachDeficiencies.length > 0 && (
                <View>
                  <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Nutrients to boost
                  </Text>
                  {zachDeficiencies.map((d) => (
                    <View
                      key={d.key}
                      className="flex-row items-start py-2 border-t border-gray-100 dark:border-gray-800"
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <View
                            className="h-1.5 rounded-full mr-2"
                            style={{
                              width: 28,
                              backgroundColor: d.pct < 20 ? '#EF4444' : d.pct < 35 ? '#F59E0B' : '#10B981',
                            }}
                          />
                          <Text className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {d.name}
                          </Text>
                          <Text
                            className="text-xs ml-1"
                            style={{ color: d.pct < 20 ? '#EF4444' : d.pct < 35 ? '#F59E0B' : '#10B981' }}
                          >
                            {Math.round(d.pct)}%
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Try: {d.foodSuggestions.slice(0, 3).join(', ')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Tap refresh to get {nutritionistName}'s personalised advice on today's nutrition. 💪
            </Text>
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
            <MacroBar label="Fiber" current={totals.macros.fiber} goal={fiberGoal} color="#10B981" />
            <MacroBar label="Sugar" current={totals.macros.sugar} goal={sugarGoal} color="#F59E0B" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

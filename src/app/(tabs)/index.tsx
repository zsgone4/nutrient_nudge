import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coffee, Sun, Moon, Cookie, Plus, Sparkles, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { MacroBar, MealCard, CircularProgress } from '@/components/NutritionComponents';
import { getSmartRecommendations } from '@/lib/utils/recommendations';
import { MealType } from '@/lib/types/nutrition';

const MEAL_CONFIG: Record<MealType, { label: string; icon: React.ReactNode; color: string }> = {
  breakfast: { label: 'Breakfast', icon: <Coffee size={24} color="#F59E0B" />, color: '#F59E0B' },
  lunch: { label: 'Lunch', icon: <Sun size={24} color="#10B981" />, color: '#10B981' },
  dinner: { label: 'Dinner', icon: <Moon size={24} color="#6366F1" />, color: '#6366F1' },
  snacks: { label: 'Snacks', icon: <Cookie size={24} color="#EC4899" />, color: '#EC4899' },
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const selectedDate = useNutritionStore(s => s.selectedDate);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const getTotalsForDate = useNutritionStore(s => s.getTotalsForDate);
  const getRemainingForDate = useNutritionStore(s => s.getRemainingForDate);
  const getEntriesForMeal = useNutritionStore(s => s.getEntriesForMeal);

  const totals = useMemo(() => getTotalsForDate(selectedDate), [selectedDate, getTotalsForDate]);
  const remaining = useMemo(() => getRemainingForDate(selectedDate), [selectedDate, getRemainingForDate]);

  const calorieProgress = totals.macros.calories / dailyGoals.macros.calories;
  const remainingCalories = Math.max(0, Math.round(dailyGoals.macros.calories - totals.macros.calories));

  const recommendations = useMemo(
    () => getSmartRecommendations(remaining.macros.calories, remaining.macros, remaining.micros, 3),
    [remaining]
  );

  const getMealCalories = (mealType: MealType) => {
    const entries = getEntriesForMeal(selectedDate, mealType);
    return entries.reduce((sum, e) => sum + e.food.macros.calories * e.servings, 0);
  };

  const getMealItemCount = (mealType: MealType) => {
    return getEntriesForMeal(selectedDate, mealType).length;
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
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text className="text-white/70 text-sm font-medium mt-4">{dateLabel}</Text>
          <Text className="text-white text-2xl font-bold mt-1">Daily Summary</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="flex-row items-center justify-between mt-6"
        >
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
                <View
                  className="h-2 bg-white rounded-full"
                  style={{ width: `${Math.min((totals.macros.carbohydrates / dailyGoals.macros.carbohydrates) * 100, 100)}%` }}
                />
              </View>
            </View>
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Protein</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.protein)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View
                  className="h-2 bg-white rounded-full"
                  style={{ width: `${Math.min((totals.macros.protein / dailyGoals.macros.protein) * 100, 100)}%` }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-white/80 text-sm">Fat</Text>
                <Text className="text-white/80 text-sm">{Math.round(totals.macros.fat)}g</Text>
              </View>
              <View className="h-2 bg-white/25 rounded-full">
                <View
                  className="h-2 bg-white rounded-full"
                  style={{ width: `${Math.min((totals.macros.fat / dailyGoals.macros.fat) * 100, 100)}%` }}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-12"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Smart Recommendations */}
        {recommendations.length > 0 && remainingCalories > 50 && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row items-center mb-3">
              <Sparkles size={20} color="#F59E0B" />
              <Text className="text-base font-semibold text-gray-900 dark:text-white ml-2">
                Smart Suggestions
              </Text>
              <View className="flex-1" />
              <Text className="text-sm text-emerald-600 dark:text-emerald-400">
                {remainingCalories} kcal left
              </Text>
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Based on your remaining macros and micronutrients
            </Text>
            {recommendations.map((rec, index) => (
              <Pressable
                key={rec.food.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/add-food', params: { mealType: 'snacks', foodId: rec.food.id } });
                }}
                className="flex-row items-center py-2.5 border-t border-gray-100 dark:border-gray-800"
              >
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">{rec.food.name}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">{rec.reasons.join(' • ')}</Text>
                </View>
                <Text className="text-sm font-semibold text-emerald-600 mr-2">{rec.food.macros.calories} kcal</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Meals */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Meals</Text>
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
                onPress={() => handleAddFood(mealType)}
              />
            );
          })}
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          className="mt-4"
        >
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Detailed Macros</Text>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
            <MacroBar
              label="Fiber"
              current={totals.macros.fiber}
              goal={dailyGoals.macros.fiber}
              color="#10B981"
            />
            <MacroBar
              label="Sugar"
              current={totals.macros.sugar}
              goal={dailyGoals.macros.sugar}
              color="#F59E0B"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/add-food');
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full items-center justify-center shadow-lg"
        style={{ marginBottom: insets.bottom }}
      >
        <Plus size={28} color="#ffffff" />
      </Pressable>
    </View>
  );
}

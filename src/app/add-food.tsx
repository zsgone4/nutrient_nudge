import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, X, Plus, Minus, Check, ChevronLeft, Apple, Beef, Milk, Wheat, Droplet, Cookie } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { FOOD_DATABASE, searchFoods } from '@/lib/data/foods';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { Food, MealType, FoodCategory, MICRONUTRIENT_INFO, Micronutrients } from '@/lib/types/nutrition';

const CATEGORY_ICONS: Record<FoodCategory, React.ReactNode> = {
  fruits: <Apple size={20} color="#10B981" />,
  vegetables: <Apple size={20} color="#22C55E" />,
  protein: <Beef size={20} color="#EF4444" />,
  dairy: <Milk size={20} color="#3B82F6" />,
  grains: <Wheat size={20} color="#F59E0B" />,
  fats: <Droplet size={20} color="#8B5CF6" />,
  snacks: <Cookie size={20} color="#EC4899" />,
  beverages: <Droplet size={20} color="#06B6D4" />,
  prepared: <Cookie size={20} color="#6B7280" />,
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string; foodId?: string }>();

  const mealType = (params.mealType as MealType) || 'snacks';
  const preselectedFoodId = params.foodId;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(
    preselectedFoodId ? FOOD_DATABASE.find(f => f.id === preselectedFoodId) || null : null
  );
  const [servings, setServings] = useState(1);
  const [showMicroDetails, setShowMicroDetails] = useState(false);

  const addFoodEntry = useNutritionStore(s => s.addFoodEntry);

  const filteredFoods = useMemo(() => {
    if (searchQuery.trim()) {
      return searchFoods(searchQuery);
    }
    return FOOD_DATABASE;
  }, [searchQuery]);

  const handleSelectFood = useCallback((food: Food) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFood(food);
    setServings(1);
    Keyboard.dismiss();
  }, []);

  const handleAddFood = useCallback(() => {
    if (!selectedFood) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFoodEntry(selectedFood, servings, mealType);
    router.back();
  }, [selectedFood, servings, mealType, addFoodEntry, router]);

  const adjustServings = useCallback((delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServings(prev => Math.max(0.25, Math.min(10, prev + delta)));
  }, []);

  const getTopMicros = useCallback((food: Food) => {
    const micros = food.micros;
    const entries: Array<{ key: keyof Micronutrients; value: number; name: string }> = [];

    (Object.keys(micros) as (keyof Micronutrients)[]).forEach(key => {
      if (micros[key] > 0) {
        entries.push({
          key,
          value: micros[key],
          name: MICRONUTRIENT_INFO[key].name,
        });
      }
    });

    return entries.sort((a, b) => b.value - a.value).slice(0, 5);
  }, []);

  // Food detail view
  if (selectedFood) {
    const { macros, micros } = selectedFood;
    const scaledMacros = {
      calories: Math.round(macros.calories * servings),
      protein: Math.round(macros.protein * servings * 10) / 10,
      carbohydrates: Math.round(macros.carbohydrates * servings * 10) / 10,
      fat: Math.round(macros.fat * servings * 10) / 10,
      fiber: Math.round(macros.fiber * servings * 10) / 10,
      sugar: Math.round(macros.sugar * servings * 10) / 10,
    };
    const topMicros = getTopMicros(selectedFood);

    return (
      <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Pressable
            onPress={() => setSelectedFood(null)}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ChevronLeft size={24} color="#6B7280" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white text-center mr-8">
            Add to {MEAL_LABELS[mealType]}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Food Info */}
          <View className="px-4 py-6 bg-white dark:bg-gray-900">
            <View className="flex-row items-center mb-2">
              <View className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                {CATEGORY_ICONS[selectedFood.category]}
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">{selectedFood.name}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFood.servingUnit} ({selectedFood.servingSize}g)
                </Text>
              </View>
            </View>
          </View>

          {/* Servings Selector */}
          <View className="px-4 py-4 bg-white dark:bg-gray-900 mt-2">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Servings</Text>
            <View className="flex-row items-center justify-center">
              <Pressable
                onPress={() => adjustServings(-0.25)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <Minus size={20} color="#6B7280" />
              </Pressable>
              <View className="mx-6 items-center">
                <Text className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {servings}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFood.servingUnit}
                </Text>
              </View>
              <Pressable
                onPress={() => adjustServings(0.25)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <Plus size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {/* Macros */}
          <View className="px-4 py-4 bg-white dark:bg-gray-900 mt-2">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Nutrition Facts</Text>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Calories</Text>
              <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {scaledMacros.calories}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-700 dark:text-gray-300">Protein</Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">{scaledMacros.protein}g</Text>
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-700 dark:text-gray-300">Carbohydrates</Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">{scaledMacros.carbohydrates}g</Text>
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-700 dark:text-gray-300 ml-4">Fiber</Text>
              <Text className="text-base text-gray-600 dark:text-gray-400">{scaledMacros.fiber}g</Text>
            </View>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base text-gray-700 dark:text-gray-300 ml-4">Sugar</Text>
              <Text className="text-base text-gray-600 dark:text-gray-400">{scaledMacros.sugar}g</Text>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-base text-gray-700 dark:text-gray-300">Fat</Text>
              <Text className="text-base font-semibold text-gray-900 dark:text-white">{scaledMacros.fat}g</Text>
            </View>
          </View>

          {/* Micronutrients Preview */}
          {topMicros.length > 0 && (
            <Pressable
              onPress={() => setShowMicroDetails(!showMicroDetails)}
              className="px-4 py-4 bg-white dark:bg-gray-900 mt-2"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Key Micronutrients
                </Text>
                <Text className="text-sm text-emerald-600 dark:text-emerald-400">
                  {showMicroDetails ? 'Show less' : 'Show all'}
                </Text>
              </View>

              {topMicros.map(({ key, value, name }) => {
                const info = MICRONUTRIENT_INFO[key];
                const scaledValue = value * servings;
                const displayValue = scaledValue < 1 ? scaledValue.toFixed(2) : Math.round(scaledValue * 10) / 10;

                return (
                  <View key={key} className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-700 dark:text-gray-300">{name}</Text>
                    <Text className="text-sm font-medium text-gray-900 dark:text-white">
                      {displayValue} {info.unit}
                    </Text>
                  </View>
                );
              })}

              {showMicroDetails && (
                <View className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  {(Object.keys(micros) as (keyof Micronutrients)[])
                    .filter(key => micros[key] > 0 && !topMicros.find(m => m.key === key))
                    .map(key => {
                      const info = MICRONUTRIENT_INFO[key];
                      const scaledValue = micros[key] * servings;
                      const displayValue = scaledValue < 1 ? scaledValue.toFixed(2) : Math.round(scaledValue * 10) / 10;

                      return (
                        <View key={key} className="flex-row items-center justify-between py-2">
                          <Text className="text-sm text-gray-600 dark:text-gray-400">{info.name}</Text>
                          <Text className="text-sm text-gray-600 dark:text-gray-400">
                            {displayValue} {info.unit}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              )}
            </Pressable>
          )}
        </ScrollView>

        {/* Add Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleAddFood}
            className="bg-emerald-500 rounded-xl py-4 flex-row items-center justify-center"
          >
            <Check size={20} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">
              Add {scaledMacros.calories} calories
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Food search view
  return (
    <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ChevronLeft size={24} color="#6B7280" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white text-center mr-8">
            Add to {MEAL_LABELS[mealType]}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mt-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
            placeholder="Search foods..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Food List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredFoods.map((food, index) => (
          <Animated.View
            key={food.id}
            entering={FadeInDown.delay(index * 30).springify()}
          >
            <Pressable
              onPress={() => handleSelectFood(food)}
              className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
            >
              <View className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3">
                {CATEGORY_ICONS[food.category]}
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 dark:text-white">{food.name}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {food.servingUnit} • {food.macros.calories} kcal
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {food.macros.protein}g P
                </Text>
                <Text className="text-xs text-gray-400">
                  {food.macros.carbohydrates}g C • {food.macros.fat}g F
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {filteredFoods.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 dark:text-gray-500 text-base">No foods found</Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

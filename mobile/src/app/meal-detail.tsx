import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2, Edit3, Minus, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { useUserStore } from '@/lib/state/user-store';
import { MealType, FoodLogEntry, Macronutrients, Micronutrients } from '@/lib/types/nutrition';
import { syncNutrientScore } from '@/lib/utils/nutrientScore';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const emptyMacros: Macronutrients = {
  calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0,
};

export default function MealDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType: string }>();
  const mealType = (params.mealType as MealType) || 'breakfast';

  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editServings, setEditServings] = useState(1);

  // Get store values
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const logs = useNutritionStore(s => s.logs);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const removeFoodEntry = useNutritionStore(s => s.removeFoodEntry);
  const updateFoodEntry = useNutritionStore(s => s.updateFoodEntry);
  const userId = useUserStore(s => s.userId);

  // Get entries for this meal
  const entries = useMemo(() => {
    const allEntries = logs[selectedDate] || [];
    return allEntries.filter(e => e.mealType === mealType);
  }, [logs, selectedDate, mealType]);

  // Calculate meal totals
  const mealTotals = useMemo(() => {
    const result = { ...emptyMacros };
    entries.forEach(entry => {
      const multiplier = entry.servings;
      (Object.keys(result) as (keyof Macronutrients)[]).forEach(key => {
        result[key] += entry.food.macros[key] * multiplier;
      });
    });
    return result;
  }, [entries]);

  const handleDeleteEntry = useCallback((entryId: string, foodName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Food',
      `Are you sure you want to remove ${foodName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            removeFoodEntry(entryId);
            setTimeout(() => {
              const updated = (logs[selectedDate] ?? []).filter(e => e.id !== entryId);
              if (userId) syncNutrientScore(userId, selectedDate, updated, dailyGoals.micros);
            }, 50);
          },
        },
      ]
    );
  }, [removeFoodEntry]);

  const handleStartEdit = useCallback((entry: FoodLogEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEntry(entry.id);
    setEditServings(entry.servings);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingEntry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateFoodEntry(editingEntry, editServings);
      setTimeout(() => {
        const updated = (logs[selectedDate] ?? []).map(e => e.id === editingEntry ? { ...e, servings: editServings } : e);
        if (userId) syncNutrientScore(userId, selectedDate, updated, dailyGoals.micros);
      }, 50);
      setEditingEntry(null);
    }
  }, [editingEntry, editServings, updateFoodEntry, userId, selectedDate, logs, dailyGoals]);

  const handleCancelEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEntry(null);
  }, []);

  const adjustServings = useCallback((delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditServings(prev => Math.max(0.25, Math.min(10, prev + delta)));
  }, []);

  const handleAddFood = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/add-food', params: { mealType } });
  }, [router, mealType]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ChevronLeft size={24} color="#6B7280" />
        </Pressable>
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {MEAL_LABELS[mealType]}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(mealTotals.calories)} kcal total
          </Text>
        </View>
        <Pressable
          onPress={handleAddFood}
          className="w-10 h-10 bg-emerald-500 rounded-full items-center justify-center"
        >
          <Plus size={20} color="#ffffff" />
        </Pressable>
      </View>

      {/* Meal Summary */}
      <View className="bg-white dark:bg-gray-900 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(mealTotals.calories)}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Calories</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round(mealTotals.protein)}g
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Protein</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round(mealTotals.carbohydrates)}g
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Carbs</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-semibold text-gray-900 dark:text-white">
              {Math.round(mealTotals.fat)}g
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Fat</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View className="items-center justify-center py-20 px-4">
            <Text className="text-gray-400 dark:text-gray-500 text-base text-center">
              No foods logged for {MEAL_LABELS[mealType].toLowerCase()} yet
            </Text>
            <Pressable
              onPress={handleAddFood}
              className="mt-4 bg-emerald-500 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Add Food</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-2">
            <Text className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </Text>
            {entries.map((entry, index) => {
              const isEditing = editingEntry === entry.id;
              const currentServings = isEditing ? editServings : entry.servings;
              const scaledCalories = Math.round(entry.food.macros.calories * currentServings);
              const gramsAmount = Math.round(entry.food.servingSize * currentServings);

              return (
                <View
                  key={entry.id}
                  className="bg-white dark:bg-gray-900 mx-4 mb-2 rounded-xl overflow-hidden"
                >
                  <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 dark:text-white">
                          {entry.food.name}
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {gramsAmount}g
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {scaledCalories}
                        </Text>
                        <Text className="text-xs text-gray-400">kcal</Text>
                      </View>
                    </View>

                    {/* Macros row */}
                    <View className="flex-row mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        P: {Math.round(entry.food.macros.protein * currentServings * 10) / 10}g
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mx-3">
                        C: {Math.round(entry.food.macros.carbohydrates * currentServings * 10) / 10}g
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        F: {Math.round(entry.food.macros.fat * currentServings * 10) / 10}g
                      </Text>
                    </View>

                    {/* Edit Mode */}
                    {isEditing ? (
                      <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Adjust amount
                        </Text>
                        <View className="flex-row items-center justify-center">
                          <Pressable
                            onPress={() => adjustServings(-0.25)}
                            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
                          >
                            <Minus size={18} color="#6B7280" />
                          </Pressable>
                          <View className="mx-4 items-center">
                            <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {gramsAmount}g
                            </Text>
                            <Text className="text-xs text-gray-500 dark:text-gray-400">
                              ({editServings} serving{editServings !== 1 ? 's' : ''})
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => adjustServings(0.25)}
                            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
                          >
                            <Plus size={18} color="#6B7280" />
                          </Pressable>
                        </View>
                        <View className="flex-row mt-4 space-x-2">
                          <Pressable
                            onPress={handleCancelEdit}
                            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl py-3 flex-row items-center justify-center mr-2"
                          >
                            <X size={16} color="#6B7280" />
                            <Text className="text-gray-600 dark:text-gray-400 font-medium ml-1">Cancel</Text>
                          </Pressable>
                          <Pressable
                            onPress={handleSaveEdit}
                            className="flex-1 bg-emerald-500 rounded-xl py-3 flex-row items-center justify-center ml-2"
                          >
                            <Check size={16} color="#ffffff" />
                            <Text className="text-white font-medium ml-1">Save</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      /* Action buttons */
                      <View className="flex-row mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Pressable
                          onPress={() => handleStartEdit(entry)}
                          className="flex-1 flex-row items-center justify-center py-2 mr-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <Edit3 size={16} color="#6B7280" />
                          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1.5">Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteEntry(entry.id, entry.food.name)}
                          className="flex-1 flex-row items-center justify-center py-2 ml-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 size={16} color="#EF4444" />
                          <Text className="text-sm text-red-500 ml-1.5">Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

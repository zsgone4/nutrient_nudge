import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, Plus, Bookmark, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useUserStore } from '@/lib/state/user-store';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { listSavedMeals, createSavedMeal, deleteSavedMeal, SavedMeal } from '@/lib/api/savedMeals';
import { MealType, FoodLogEntry } from '@/lib/types/nutrition';

const MEAL_OPTIONS: { type: MealType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <Coffee size={22} color="#F59E0B" />, color: '#F59E0B' },
  { type: 'lunch', label: 'Lunch', icon: <Sun size={22} color="#10B981" />, color: '#10B981' },
  { type: 'dinner', label: 'Dinner', icon: <Moon size={22} color="#6366F1" />, color: '#6366F1' },
  { type: 'snacks', label: 'Snacks', icon: <Cookie size={22} color="#EC4899" />, color: '#EC4899' },
];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function mealCalories(meal: SavedMeal): number {
  return Math.round(
    meal.items.reduce((sum, item) => sum + item.food.macros.calories * item.servings, 0)
  );
}

export default function SavedMealsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const userId = useUserStore(s => s.userId);
  const addFoodEntry = useNutritionStore(s => s.addFoodEntry);
  const logs = useNutritionStore(s => s.logs);

  const today = getTodayString();
  const todayEntries = useMemo<FoodLogEntry[]>(() => logs[today] ?? [], [logs, today]);

  const todaysMeals = useMemo(() => {
    return MEAL_OPTIONS.map((opt) => {
      const entries = todayEntries.filter((e) => e.mealType === opt.type);
      return { ...opt, entries };
    }).filter((m) => m.entries.length > 0);
  }, [todayEntries]);

  const [pickerMeal, setPickerMeal] = useState<SavedMeal | null>(null);
  const [saveSource, setSaveSource] = useState<{ mealType: MealType; entries: FoodLogEntry[] } | null>(null);
  const [saveName, setSaveName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: savedMeals, isLoading, isError, refetch } = useQuery({
    queryKey: ['savedMeals', userId],
    queryFn: () => listSavedMeals(userId as string),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSavedMeal(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['savedMeals', userId] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (vars: { name: string; entries: FoodLogEntry[] }) =>
      createSavedMeal(
        userId as string,
        vars.name,
        vars.entries.map((e) => ({ servings: e.servings, food: e.food }))
      ),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['savedMeals', userId] });
      setSaveSource(null);
      setSaveName('');
      setSaveError(null);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSaveError("Couldn't save this meal. Please try again.");
    },
  });

  const handleOpenSave = useCallback((mealType: MealType, entries: FoodLogEntry[]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaveSource({ mealType, entries });
    setSaveName(MEAL_LABELS[mealType]);
    setSaveError(null);
  }, []);

  const handleConfirmSave = useCallback(() => {
    if (!saveSource) return;
    const name = saveName.trim();
    if (!name) {
      setSaveError('Please enter a name.');
      return;
    }
    saveMutation.mutate({ name, entries: saveSource.entries });
  }, [saveSource, saveName, saveMutation]);

  const handleLogMeal = useCallback((mealType: MealType) => {
    if (!pickerMeal) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    pickerMeal.items.forEach((item) => {
      addFoodEntry(item.food, item.servings, mealType);
    });
    setPickerMeal(null);
    router.back();
  }, [pickerMeal, addFoodEntry, router]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
          <ChevronLeft size={24} color="#6B7280" />
        </Pressable>
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">Saved Meals</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">Save a meal once, log it in one tap</Text>
        </View>
      </View>

      {!userId ? (
        <View className="items-center justify-center py-20 px-6">
          <Text className="text-gray-400 dark:text-gray-500 text-base text-center">
            Sign in to save and reuse your meals.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {todaysMeals.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Save from today
              </Text>
              {todaysMeals.map((m) => (
                <View key={m.type} className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-2 shadow-sm flex-row items-center">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: m.color + '22' }}>
                    {m.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 dark:text-white">{m.label}</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      {m.entries.length} {m.entries.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenSave(m.type, m.entries)}
                    className="flex-row items-center px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 active:opacity-70"
                  >
                    <Bookmark size={15} color="#10B981" />
                    <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold ml-1.5">Save</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Text className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Your saved meals
          </Text>

          {isLoading ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          ) : isError ? (
            <View className="items-center justify-center py-16 px-6">
              <Text className="text-gray-500 dark:text-gray-400 text-base text-center mb-4">
                Couldn't load your saved meals.
              </Text>
              <Pressable onPress={() => refetch()} className="bg-emerald-500 rounded-xl px-6 py-3">
                <Text className="text-white font-semibold">Try Again</Text>
              </Pressable>
            </View>
          ) : !savedMeals || savedMeals.length === 0 ? (
            <View className="items-center justify-center py-12 px-8">
              <View className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-4">
                <Bookmark size={28} color="#10B981" />
              </View>
              <Text className="text-gray-900 dark:text-white text-base font-semibold text-center mb-1">
                No saved meals yet
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Log some food today, then tap "Save" above to store a meal for one-tap logging later.
              </Text>
            </View>
          ) : (
            savedMeals.map((meal) => (
              <View key={meal.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-gray-900 dark:text-white">{meal.name}</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {meal.items.length} {meal.items.length === 1 ? 'item' : 'items'} • {mealCalories(meal)} kcal
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => deleteMutation.mutate(meal.id)}
                    disabled={deleteMutation.isPending}
                    className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center"
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>

                <View className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  {meal.items.slice(0, 4).map((item, i) => (
                    <Text key={i} className="text-sm text-gray-600 dark:text-gray-400 py-0.5">
                      • {item.food.name}
                      <Text className="text-gray-400 dark:text-gray-500">
                        {'  '}{Math.round(item.food.servingSize * item.servings)}g
                      </Text>
                    </Text>
                  ))}
                  {meal.items.length > 4 && (
                    <Text className="text-sm text-gray-400 dark:text-gray-500 py-0.5">
                      + {meal.items.length - 4} more
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPickerMeal(meal); }}
                  className="mt-3 bg-emerald-500 rounded-xl py-3 flex-row items-center justify-center active:opacity-80"
                >
                  <Plus size={18} color="#ffffff" />
                  <Text className="text-white font-semibold ml-1.5">Add to today</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!saveSource}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveSource(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSaveSource(null)}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-4">
              <View className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                <Bookmark size={22} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Save Meal</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {saveSource ? `${saveSource.entries.length} item${saveSource.entries.length === 1 ? '' : 's'} to reuse later` : ''}
                </Text>
              </View>
            </View>

            <TextInput
              value={saveName}
              onChangeText={(t) => { setSaveName(t); setSaveError(null); }}
              placeholder="e.g. My Protein Breakfast"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-4 text-base text-gray-900 dark:text-white"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmSave}
            />

            {saveError && <Text className="text-red-500 text-sm mt-2 px-1">{saveError}</Text>}

            <Pressable
              onPress={handleConfirmSave}
              disabled={saveMutation.isPending}
              className="bg-emerald-500 rounded-2xl py-4 items-center mt-4 active:opacity-80"
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Save Meal</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!pickerMeal}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerMeal(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setPickerMeal(null)}
        >
          <Pressable
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Add "{pickerMeal?.name}" to
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose which meal to log these items under.
            </Text>
            {MEAL_OPTIONS.map((option) => (
              <Pressable
                key={option.type}
                onPress={() => handleLogMeal(option.type)}
                className="flex-row items-center py-3.5 px-3 mb-2 bg-gray-50 dark:bg-gray-800 rounded-2xl active:opacity-70"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: option.color + '22' }}>
                  {option.icon}
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">{option.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

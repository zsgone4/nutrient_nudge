import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Modal,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Pencil, Trash2, Plus, Minus, X, Check, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { SavedMeal } from '@/lib/state/nutrition-store';
import { useSavedMeals } from '@/lib/hooks/useSavedMeals';
import { Food } from '@/lib/types/nutrition';

export default function SavedMealsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { savedMeals, isLoading, updateMeal, deleteMeal } = useSavedMeals();

  const [editingMeal, setEditingMeal] = useState<SavedMeal | null>(null);
  const [editName, setEditName] = useState('');
  const [editEntries, setEditEntries] = useState<{ food: Food; servings: number }[]>([]);

  const openEdit = useCallback((meal: SavedMeal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMeal(meal);
    setEditName(meal.name);
    setEditEntries(meal.entries.map(e => ({ ...e })));
  }, []);

  const closeEdit = useCallback(() => {
    setEditingMeal(null);
    setEditName('');
    setEditEntries([]);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMeal) return;
    const name = editName.trim();
    if (!name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await updateMeal.mutateAsync({ id: editingMeal.id, name, entries: editEntries });
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      return;
    }
    closeEdit();
  }, [editingMeal, editName, editEntries, updateMeal, closeEdit]);

  const handleDeleteMeal = useCallback((meal: SavedMeal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Saved Meal',
      `Remove "${meal.name}" from your saved meals?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMeal.mutate(meal.id),
        },
      ]
    );
  }, [deleteMeal]);

  const adjustServings = useCallback((index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditEntries(prev => prev.map((e, i) => {
      if (i !== index) return e;
      const next = Math.max(0.25, Math.min(20, e.servings + delta));
      return { ...e, servings: Math.round(next * 100) / 100 };
    }));
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddFood = useCallback(() => {
    if (!editingMeal) return;
    router.push({ pathname: '/add-food', params: { savedMealId: editingMeal.id } });
    closeEdit();
  }, [editingMeal, router, closeEdit]);

  const mealCalories = useCallback((meal: SavedMeal) =>
    Math.round(meal.entries.reduce((sum, e) => sum + e.food.macros.calories * e.servings, 0)),
  []);

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
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">My Saved Meals</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {savedMeals.length} {savedMeals.length === 1 ? 'meal' : 'meals'} saved
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : savedMeals.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mb-4">
            <UtensilsCrossed size={36} color="#10B981" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
            No saved meals yet
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
            Log a meal, then tap the bookmark icon to save it for quick re-use on future days.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
            Tap Edit to change ingredients or amounts
          </Text>

          {savedMeals.map(meal => {
            const totalCals = mealCalories(meal);
            const totalProtein = Math.round(meal.entries.reduce((s, e) => s + e.food.macros.protein * e.servings, 0));
            const totalCarbs = Math.round(meal.entries.reduce((s, e) => s + e.food.macros.carbohydrates * e.servings, 0));
            const totalFat = Math.round(meal.entries.reduce((s, e) => s + e.food.macros.fat * e.servings, 0));

            return (
              <View key={meal.id} className="bg-white dark:bg-gray-900 rounded-2xl mb-4 overflow-hidden">
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-1">
                    <Text className="text-base font-bold text-gray-900 dark:text-white flex-1 mr-2" numberOfLines={1}>
                      {meal.name}
                    </Text>
                    <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {totalCals} kcal
                    </Text>
                  </View>

                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {meal.entries.length} {meal.entries.length === 1 ? 'item' : 'items'} · P: {totalProtein}g · C: {totalCarbs}g · F: {totalFat}g
                  </Text>

                  {meal.entries.slice(0, 3).map((entry, i) => (
                    <View key={i} className="flex-row items-center py-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                      <Text className="text-sm text-gray-600 dark:text-gray-400 flex-1" numberOfLines={1}>
                        {entry.food.name}
                      </Text>
                      <Text className="text-sm text-gray-400 dark:text-gray-500">
                        {Math.round(entry.food.servingSize * entry.servings)}g
                      </Text>
                    </View>
                  ))}
                  {meal.entries.length > 3 && (
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-3.5">
                      +{meal.entries.length - 3} more items
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row border-t border-gray-100 dark:border-gray-800">
                  <Pressable
                    onPress={() => openEdit(meal)}
                    className="flex-1 flex-row items-center justify-center py-3 active:bg-gray-50 dark:active:bg-gray-800"
                  >
                    <Pencil size={16} color="#10B981" />
                    <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-1.5">Edit</Text>
                  </Pressable>
                  <View className="w-px bg-gray-100 dark:bg-gray-800" />
                  <Pressable
                    onPress={() => handleDeleteMeal(meal)}
                    className="flex-1 flex-row items-center justify-center py-3 active:bg-red-50 dark:active:bg-red-900/20"
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text className="text-sm font-semibold text-red-500 ml-1.5">Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editingMeal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={closeEdit}
          >
            <Pressable
              onPress={() => {}}
              className="bg-white dark:bg-gray-900 rounded-t-3xl"
              style={{ maxHeight: '85%', paddingBottom: insets.bottom + 16 }}
            >
              {/* Modal Header */}
              <View className="flex-row items-center px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full absolute self-center top-2 left-0 right-0 mx-auto" style={{ width: 40, left: '50%', transform: [{ translateX: -20 }] }} />
                <View className="flex-1 mt-3">
                  <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Meal Name</Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    className="text-xl font-bold text-gray-900 dark:text-white"
                    placeholder="Meal name"
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="done"
                  />
                </View>
                <Pressable onPress={closeEdit} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center ml-3">
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {/* Items */}
                <View className="px-5 pt-3">
                  <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Ingredients ({editEntries.length})
                  </Text>

                  {editEntries.length === 0 && (
                    <Text className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                      No items — add some below
                    </Text>
                  )}

                  {editEntries.map((entry, index) => {
                    const grams = Math.round(entry.food.servingSize * entry.servings);
                    return (
                      <View key={index} className="flex-row items-center py-3 border-b border-gray-100 dark:border-gray-800">
                        <View className="flex-1 mr-3">
                          <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
                            {entry.food.name}
                          </Text>
                          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {Math.round(entry.food.macros.calories * entry.servings)} kcal
                          </Text>
                        </View>

                        {/* Serving adjust */}
                        <View className="flex-row items-center mr-2">
                          <Pressable
                            onPress={() => adjustServings(index, -0.25)}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
                          >
                            <Minus size={14} color="#6B7280" />
                          </Pressable>
                          <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mx-2 min-w-[42px] text-center">
                            {grams}g
                          </Text>
                          <Pressable
                            onPress={() => adjustServings(index, 0.25)}
                            className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
                          >
                            <Plus size={14} color="#6B7280" />
                          </Pressable>
                        </View>

                        <Pressable
                          onPress={() => handleRemoveItem(index)}
                          className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center"
                        >
                          <X size={14} color="#EF4444" />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {/* Add Food button */}
                <Pressable
                  onPress={handleAddFood}
                  className="flex-row items-center mx-5 mt-4 mb-2 py-3 border border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl justify-center active:opacity-70"
                >
                  <Plus size={18} color="#10B981" />
                  <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-2">
                    Add Ingredient
                  </Text>
                </Pressable>
              </ScrollView>

              {/* Save button */}
              <View className="px-5 pt-3">
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={!editName.trim() || editEntries.length === 0 || updateMeal.isPending}
                  className="bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                  style={{ opacity: (!editName.trim() || editEntries.length === 0 || updateMeal.isPending) ? 0.45 : 1 }}
                >
                  {updateMeal.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Check size={18} color="#ffffff" />
                      <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

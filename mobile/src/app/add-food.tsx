import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, Pressable, Keyboard, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, InputAccessoryView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, X, Plus, Minus, Check, ChevronLeft, Apple, Beef, Milk, Wheat, Droplet, Cookie, ScanBarcode, AlertCircle, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { FOOD_DATABASE, searchFoods } from '@/lib/data/foods';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { useUserStore } from '@/lib/state/user-store';
import { useSavedMeals, SavedMeal } from '@/lib/state/saved-meals-store';
import { Food, MealType, FoodCategory, MICRONUTRIENT_INFO, Micronutrients, DAILY_VALUES } from '@/lib/types/nutrition';
import { useColorScheme } from '@/lib/useColorScheme';
import { syncNutrientScore } from '@/lib/utils/nutrientScore';
import { log } from '@/lib/logger';

import { BACKEND_URL } from '@/lib/config';

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

async function fetchProductByBarcode(barcode: string): Promise<Food | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'NutritionApp/1.0' } }
    );
    if (!res.ok) {
      log.warn('barcode.lookup.http_error', { barcode, status: res.status });
      return null;
    }
    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      log.info('barcode.lookup.not_found', { barcode });
      return null;
    }

    const p = data.product;
    const n = p.nutriments ?? {};
    const name: string = p.product_name_en || p.product_name || '';
    if (!name) return null;

    const food: Food = {
      id: `barcode-${barcode}`,
      name,
      servingSize: 100,
      servingUnit: 'g',
      category: 'prepared',
      macros: {
        calories: Math.round(n['energy-kcal_100g'] ?? (n['energy_100g'] ?? 0) / 4.184),
        protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
        carbohydrates: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
        fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
        fiber: Math.round((n.fiber_100g ?? 0) * 10) / 10,
        sugar: Math.round((n.sugars_100g ?? 0) * 10) / 10,
      },
      micros: {
        vitaminA: (n['vitamin-a_100g'] ?? 0) * 1000000,
        vitaminB1: (n['vitamin-b1_100g'] ?? n.thiamin_100g ?? 0) * 1000,
        vitaminB2: (n['vitamin-b2_100g'] ?? n.riboflavin_100g ?? 0) * 1000,
        vitaminB3: (n['vitamin-pp_100g'] ?? n.niacin_100g ?? 0) * 1000,
        vitaminB5: (n['pantothenic-acid_100g'] ?? 0) * 1000,
        vitaminB6: (n['vitamin-b6_100g'] ?? 0) * 1000,
        vitaminB7: (n['biotin_100g'] ?? 0) * 1000000,
        vitaminB9: (n['folates_100g'] ?? n['folic-acid_100g'] ?? 0) * 1000000,
        vitaminB12: (n['vitamin-b12_100g'] ?? 0) * 1000000,
        vitaminC: (n['vitamin-c_100g'] ?? 0) * 1000,
        vitaminD: (n['vitamin-d_100g'] ?? 0) * 1000000,
        vitaminE: (n['vitamin-e_100g'] ?? 0) * 1000,
        vitaminK: (n['vitamin-k_100g'] ?? 0) * 1000000,
        calcium: (n.calcium_100g ?? 0) * 1000,
        iron: (n.iron_100g ?? 0) * 1000,
        magnesium: (n.magnesium_100g ?? 0) * 1000,
        phosphorus: (n.phosphorus_100g ?? 0) * 1000,
        potassium: (n.potassium_100g ?? 0) * 1000,
        sodium: (n.sodium_100g ?? 0) * 1000,
        zinc: (n.zinc_100g ?? 0) * 1000,
        copper: (n.copper_100g ?? 0) * 1000,
        manganese: (n.manganese_100g ?? 0) * 1000,
        selenium: (n.selenium_100g ?? 0) * 1000000,
        chromium: (n.chromium_100g ?? 0) * 1000000,
        iodine: (n.iodine_100g ?? 0) * 1000000,
      },
    };
    return food;
  } catch (err) {
    log.error('barcode.lookup.failed', { err, barcode });
    return null;
  }
}

async function fetchFoodByBarcodeFromBackend(barcode: string): Promise<Food | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/foods/barcode/${barcode}`);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.food;
    if (!f) return null;
    return {
      id: f.id,
      name: f.name,
      servingSize: Number(f.servingSize),
      servingUnit: f.servingUnit,
      category: f.category,
      macros: {
        calories: Number(f.calories),
        protein: Number(f.protein),
        carbohydrates: Number(f.carbohydrates),
        fat: Number(f.fat),
        fiber: Number(f.fiber ?? 0),
        sugar: Number(f.sugar ?? 0),
      },
      micros: {
        vitaminA: Number(f.vitaminA ?? 0),
        vitaminB1: Number(f.vitaminB1 ?? 0),
        vitaminB2: Number(f.vitaminB2 ?? 0),
        vitaminB3: Number(f.vitaminB3 ?? 0),
        vitaminB5: Number(f.vitaminB5 ?? 0),
        vitaminB6: Number(f.vitaminB6 ?? 0),
        vitaminB7: Number(f.vitaminB7 ?? 0),
        vitaminB9: Number(f.vitaminB9 ?? 0),
        vitaminB12: Number(f.vitaminB12 ?? 0),
        vitaminC: Number(f.vitaminC ?? 0),
        vitaminD: Number(f.vitaminD ?? 0),
        vitaminE: Number(f.vitaminE ?? 0),
        vitaminK: Number(f.vitaminK ?? 0),
        calcium: Number(f.calcium ?? 0),
        iron: Number(f.iron ?? 0),
        magnesium: Number(f.magnesium ?? 0),
        phosphorus: Number(f.phosphorus ?? 0),
        potassium: Number(f.potassium ?? 0),
        sodium: Number(f.sodium ?? 0),
        zinc: Number(f.zinc ?? 0),
        copper: Number(f.copper ?? 0),
        manganese: Number(f.manganese ?? 0),
        selenium: Number(f.selenium ?? 0),
        chromium: Number(f.chromium ?? 0),
        iodine: Number(f.iodine ?? 0),
      },
    };
  } catch {
    return null;
  }
}

async function saveFoodToBackend(food: Food, barcode?: string): Promise<string | null> {
  try {
    const payload = {
      ...(barcode && { barcode }),
      name: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      category: food.category,
      calories: food.macros.calories,
      protein: food.macros.protein,
      carbohydrates: food.macros.carbohydrates,
      fat: food.macros.fat,
      fiber: food.macros.fiber,
      sugar: food.macros.sugar,
      ...food.micros,
    };
    const res = await fetch(`${BACKEND_URL}/api/foods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      log.warn('food.save_to_backend.http_error', { status: res.status, name: food.name });
      return null;
    }
    const data = await res.json();
    return data.food?.id ?? null;
  } catch (err) {
    log.error('food.save_to_backend.failed', { err, name: food.name });
    return null;
  }
}

async function searchFoodsAPI(query: string): Promise<Food[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/foods/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      log.warn('food.search.http_error', { status: res.status, query });
      return [];
    }
    const data = await res.json();
    return (data.foods ?? []).map((f: any): Food => ({
      id: f.id,
      name: f.name,
      servingSize: Number(f.servingSize),
      servingUnit: f.servingUnit,
      category: f.category,
      macros: {
        calories: Number(f.calories),
        protein: Number(f.protein),
        carbohydrates: Number(f.carbohydrates),
        fat: Number(f.fat),
        fiber: Number(f.fiber ?? 0),
        sugar: Number(f.sugar ?? 0),
      },
      micros: {
        vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
        vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
        vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
        phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
        selenium: 0, chromium: 0, iodine: 0,
      },
    }));
  } catch (err) {
    log.error('food.search.failed', { err, query });
    return [];
  }
}

const styles = StyleSheet.create({
  doneBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    paddingHorizontal: 16,
    height: 44,
  },
  doneButton: { paddingHorizontal: 8, paddingVertical: 6 },
  doneText: { color: '#007AFF', fontSize: 17, fontWeight: '600' as const },
});

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ mealType?: string; foodId?: string; savedMealId?: string }>();

  const mealType = (params.mealType as MealType) || 'snacks';
  const preselectedFoodId = params.foodId;
  const savedMealId = params.savedMealId ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(
    preselectedFoodId ? FOOD_DATABASE.find(f => f.id === preselectedFoodId) || null : null
  );
  const [servings, setServings] = useState(1);
  const [gramInput, setGramInput] = useState('');
  const [showMicroDetails, setShowMicroDetails] = useState(false);

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [apiResults, setApiResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addFoodEntry = useNutritionStore(s => s.addFoodEntry);
  const selectedDate = useNutritionStore(s => s.selectedDate);
  const logs = useNutritionStore(s => s.logs);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const userId = useUserStore(s => s.userId);
  const { savedMeals, updateMeal, deleteMeal } = useSavedMeals();

  // Collect unique foods from past days for this meal type, newest day first
  const recentFoods = useMemo(() => {
    const pastDates = Object.keys(logs)
      .filter(d => d < selectedDate)
      .sort((a, b) => b.localeCompare(a));
    const seenIds = new Set<string>();
    const result: Food[] = [];
    for (const date of pastDates) {
      for (const entry of (logs[date] ?? [])) {
        if (entry.mealType === mealType && !seenIds.has(entry.food.id)) {
          seenIds.add(entry.food.id);
          result.push(entry.food);
        }
      }
    }
    return result;
  }, [logs, selectedDate, mealType]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return recentFoods;
    const local = searchFoods(searchQuery);
    const localIds = new Set(local.map(f => f.id));
    const extras = apiResults.filter(f => !localIds.has(f.id));
    return [...local, ...extras];
  }, [searchQuery, apiResults, recentFoods]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setApiResults([]); return; }
    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchFoodsAPI(text);
      setApiResults(results);
      setIsSearching(false);
    }, 500);
  }, []);

  const handleSelectFood = useCallback((food: Food) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFood(food);
    setServings(1);
    setGramInput(String(food.servingSize));
    Keyboard.dismiss();
  }, []);

  const handleAddSavedMeal = useCallback((meal: SavedMeal) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    meal.entries.forEach(e => addFoodEntry(e.food, e.servings, mealType));
    setTimeout(() => {
      const existing = logs[selectedDate] ?? [];
      const added = meal.entries.map(e => ({ food: e.food, servings: e.servings, mealType, id: '', timestamp: 0, date: selectedDate }));
      if (userId) syncNutrientScore(userId, selectedDate, [...existing, ...added], dailyGoals.micros);
    }, 50);
    router.back();
  }, [addFoodEntry, mealType, logs, selectedDate, userId, dailyGoals, router]);

  const handleAddFood = useCallback(async () => {
    if (!selectedFood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (savedMealId) {
      const currentMeal = savedMeals.find(m => m.id === savedMealId);
      if (currentMeal) {
        const newEntries = [...currentMeal.entries, { food: selectedFood, servings }];
        await updateMeal.mutateAsync({ id: savedMealId, name: currentMeal.name, entries: newEntries });
      }
    } else {
      addFoodEntry(selectedFood, servings, mealType);
      setTimeout(() => {
        const updatedEntries = [...(logs[selectedDate] ?? []), { food: selectedFood, servings, mealType, id: '', timestamp: 0, date: selectedDate }];
        if (userId) syncNutrientScore(userId, selectedDate, updatedEntries, dailyGoals.micros);
      }, 50);
    }
    router.back();
  }, [selectedFood, servings, mealType, addFoodEntry, savedMealId, savedMeals, updateMeal, router, userId, selectedDate, logs, dailyGoals]);

  const adjustServings = useCallback((delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setServings(prev => {
      const next = Math.max(0.25, Math.min(10, prev + delta));
      if (selectedFood) setGramInput(String(Math.round(selectedFood.servingSize * next)));
      return next;
    });
  }, [selectedFood]);

  const handleGramInputChange = useCallback((text: string) => {
    setGramInput(text);
    const grams = parseFloat(text);
    if (selectedFood && !isNaN(grams) && grams > 0) {
      const newServings = Math.max(0.01, Math.min(20, grams / selectedFood.servingSize));
      setServings(Math.round(newServings * 100) / 100);
    }
  }, [selectedFood]);

  const handleGramInputBlur = useCallback(() => {
    if (selectedFood) {
      setGramInput(String(Math.round(selectedFood.servingSize * servings)));
    }
  }, [selectedFood, servings]);

  const getTopMicros = useCallback((food: Food) => {
    const micros = food.micros;
    const entries: Array<{ key: keyof Micronutrients; value: number; name: string }> = [];
    (Object.keys(micros) as (keyof Micronutrients)[]).forEach(key => {
      if (micros[key] > 0) entries.push({ key, value: micros[key], name: MICRONUTRIENT_INFO[key].name });
    });
    return entries.sort((a, b) => b.value - a.value).slice(0, 5);
  }, []);

  const getHighMicros = useCallback((food: Food, currentServings: number) => {
    const micros = food.micros;
    const highlights: Array<{ key: keyof Micronutrients; name: string; pct: number }> = [];
    (Object.keys(micros) as (keyof Micronutrients)[]).forEach(key => {
      const value = micros[key] * currentServings;
      const dv = DAILY_VALUES.micros[key];
      if (dv > 0 && value > 0) {
        const pct = (value / dv) * 100;
        if (pct >= 20) {
          highlights.push({ key, name: MICRONUTRIENT_INFO[key].name, pct: Math.round(pct) });
        }
      }
    });
    return highlights.sort((a, b) => b.pct - a.pct).slice(0, 5);
  }, []);

  const handleBarcodeLookup = useCallback(async () => {
    const barcode = barcodeInput.trim();
    if (barcode.length < 8) {
      setBarcodeError('Please enter a valid barcode (8–13 digits).');
      return;
    }
    Keyboard.dismiss();
    setIsFetching(true);
    setBarcodeError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check shared backend database first — avoids redundant API calls and shares community scans
    let food = await fetchFoodByBarcodeFromBackend(barcode);

    if (!food) {
      // Not in shared DB yet — fetch from Open Food Facts and save for everyone
      food = await fetchProductByBarcode(barcode);
      if (food) {
        saveFoodToBackend(food, barcode).catch(() => {});
      }
    }

    setIsFetching(false);

    if (food) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBarcodeModal(false);
      setBarcodeInput('');
      setSelectedFood(food);
      setServings(1);
      setGramInput(String(food.servingSize));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBarcodeError('Product not found. Check the barcode and try again.');
    }
  }, [barcodeInput]);

  // ── Food Detail View ───────────────────────────────────────────
  if (selectedFood) {
    const { macros, micros } = selectedFood;
    const scaledMacros = {
      calories: Math.round(macros.calories * servings),
      protein: Math.round(macros.protein * servings),
      carbohydrates: Math.round(macros.carbohydrates * servings),
      fat: Math.round(macros.fat * servings),
      fiber: Math.round(macros.fiber * servings),
      sugar: Math.round(macros.sugar * servings),
    };
    const topMicros = getTopMicros(selectedFood);
    const highMicros = getHighMicros(selectedFood, servings);

    return (
      <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Pressable
            onPress={() => setSelectedFood(null)}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ChevronLeft size={24} color="#6B7280" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white text-center mr-8">
            {savedMealId ? 'Add to Saved Meal' : `Add to ${MEAL_LABELS[mealType]}`}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View className="px-4 py-6 bg-white dark:bg-gray-900">
            <View className="flex-row items-center mb-2">
              <View className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                {CATEGORY_ICONS[selectedFood.category]}
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">{selectedFood.name}</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedFood.servingSize}g per serving
                </Text>
              </View>
            </View>
            {highMicros.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center mb-2">
                  <Zap size={13} color="#10B981" />
                  <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-1 uppercase tracking-wider">
                    High in
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {highMicros.map(({ key, name, pct }) => (
                    <View
                      key={key}
                      className="bg-emerald-50 dark:bg-emerald-900/25 border border-emerald-200 dark:border-emerald-700 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
                    >
                      <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{name}</Text>
                      <Text className="text-xs text-emerald-500 dark:text-emerald-400 ml-1">{pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Amount with editable gram input */}
          <View className="px-4 py-4 bg-white dark:bg-gray-900 mt-2">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Amount</Text>
            <View className="flex-row items-center justify-center">
              <Pressable
                onPress={() => adjustServings(-0.25)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <Minus size={20} color="#6B7280" />
              </Pressable>
              <View className="mx-6 items-center">
                <TextInput
                  value={gramInput}
                  onChangeText={handleGramInputChange}
                  onBlur={handleGramInputBlur}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  inputAccessoryViewID={Platform.OS === 'ios' ? 'gramDone' : undefined}
                  style={{
                    fontSize: 40,
                    fontWeight: '700',
                    color: isDark ? '#34D399' : '#059669',
                    textAlign: 'center',
                    minWidth: 80,
                  }}
                />
                <Text className="text-sm text-gray-500 dark:text-gray-400">grams</Text>
              </View>
              <Pressable
                onPress={() => adjustServings(0.25)}
                className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <Plus size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          <View className="px-4 py-4 bg-white dark:bg-gray-900 mt-2">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Nutrition Facts</Text>
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Calories</Text>
              <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{scaledMacros.calories}</Text>
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

          {topMicros.length > 0 && (
            <Pressable
              onPress={() => setShowMicroDetails(!showMicroDetails)}
              className="px-4 py-4 bg-white dark:bg-gray-900 mt-2"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Micronutrients</Text>
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

        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleAddFood}
            className="bg-emerald-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80"
          >
            <Check size={20} color="#ffffff" />
            <Text className="text-white font-semibold text-base ml-2">
              {savedMealId ? `Add to Meal (${scaledMacros.calories} kcal)` : `Add ${scaledMacros.calories} calories`}
            </Text>
          </Pressable>
        </View>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="gramDone">
            <View style={styles.doneBar}>
              <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}
      </View>
    );
  }

  // ── Food Search View ───────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ChevronLeft size={24} color="#6B7280" />
          </Pressable>
          <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white text-center">
            {savedMealId ? 'Add to Saved Meal' : `Add to ${MEAL_LABELS[mealType]}`}
          </Text>
          <Pressable
            onPress={() => { setBarcodeError(null); setBarcodeInput(''); setShowBarcodeModal(true); }}
            className="w-10 h-10 items-center justify-center"
          >
            <ScanBarcode size={24} color="#10B981" />
          </Pressable>
        </View>

        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 mt-3">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
            placeholder="Search foods..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : searchQuery.length > 0 ? (
            <Pressable onPress={() => { setSearchQuery(''); setApiResults([]); }}>
              <X size={20} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => { setBarcodeError(null); setBarcodeInput(''); setShowBarcodeModal(true); }}
          className="flex-row items-center justify-center mt-3 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 active:opacity-70"
        >
          <ScanBarcode size={18} color="#10B981" />
          <Text className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm ml-2">
            Scan Barcode
          </Text>
        </Pressable>
      </View>

      {/* My Saved Meals */}
      {savedMeals.length > 0 && (
        <View className="mt-2">
          <Text className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            My Meals
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {savedMeals.map(meal => {
              const totalCals = Math.round(meal.entries.reduce((sum, e) => sum + e.food.macros.calories * e.servings, 0));
              return (
                <Pressable
                  key={meal.id}
                  onPress={() => handleAddSavedMeal(meal)}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert('Delete Meal', `Remove "${meal.name}" from saved meals?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteMeal.mutate(meal.id) },
                    ]);
                  }}
                  className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 active:opacity-70"
                  style={{ minWidth: 120 }}
                >
                  <Text className="text-emerald-800 dark:text-emerald-300 font-semibold text-sm" numberOfLines={1}>{meal.name}</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">{totalCals} kcal · {meal.entries.length} items</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListHeaderComponent={
          !searchQuery.trim() && recentFoods.length > 0 ? (
            <Text className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Recent {MEAL_LABELS[mealType]} Foods
            </Text>
          ) : null
        }
        renderItem={({ item: food }) => (
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
                {food.servingSize}g • {food.macros.calories} kcal
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(food.macros.protein)}g P
              </Text>
              <Text className="text-xs text-gray-400">
                {Math.round(food.macros.carbohydrates)}g C • {Math.round(food.macros.fat)}g F
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            {!searchQuery.trim() ? (
              <>
                <Text className="text-gray-400 dark:text-gray-500 text-base">No recent {MEAL_LABELS[mealType].toLowerCase()} foods</Text>
                <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1 text-center px-8">
                  Foods you log for {MEAL_LABELS[mealType].toLowerCase()} will appear here for quick re-adding
                </Text>
              </>
            ) : (
              <>
                <Text className="text-gray-400 dark:text-gray-500 text-base">No foods found</Text>
                <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term</Text>
              </>
            )}
          </View>
        }
      />

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="barcodeDone">
          <View style={styles.doneBar}>
            <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      {/* Barcode Lookup Modal */}
      <Modal
        visible={showBarcodeModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowBarcodeModal(false); Keyboard.dismiss(); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            onPress={() => { setShowBarcodeModal(false); Keyboard.dismiss(); }}
          >
            <Pressable
              onPress={() => {}}
              className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5"
              style={{ paddingBottom: insets.bottom + 20 }}
            >
              <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />

              <View className="flex-row items-center mb-5">
                <View className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                  <ScanBarcode size={22} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white">Barcode Lookup</Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">Enter the number from the product packaging</Text>
                </View>
              </View>

              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-5 mb-2">
                <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Barcode number (EAN-13 / UPC)
                </Text>
                <View className="flex-row items-center">
                  <TextInput
                    style={{ flex: 1, fontSize: 28, fontWeight: '700', letterSpacing: 3, color: isDark ? '#F9FAFB' : '#111827' }}
                    placeholder="0000000000000"
                    placeholderTextColor="#D1D5DB"
                    value={barcodeInput}
                    onChangeText={text => { setBarcodeInput(text.replace(/\D/g, '')); setBarcodeError(null); }}
                    keyboardType="number-pad"
                    maxLength={14}
                    autoFocus
                    returnKeyType="search"
                    onSubmitEditing={handleBarcodeLookup}
                  />
                  {barcodeInput.length > 0 && (
                    <Pressable
                      onPress={() => { setBarcodeInput(''); setBarcodeError(null); }}
                      className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
                    >
                      <X size={16} color="#6B7280" />
                    </Pressable>
                  )}
                </View>
                <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {barcodeInput.length} / 13 digits
                </Text>
              </View>

              {barcodeError && (
                <View className="flex-row items-center mb-3 px-1">
                  <AlertCircle size={15} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-1.5 flex-1">{barcodeError}</Text>
                </View>
              )}

              <Pressable
                onPress={handleBarcodeLookup}
                disabled={isFetching || barcodeInput.length < 8}
                className="bg-emerald-500 rounded-2xl py-4 items-center mt-2 active:opacity-80"
                style={{ opacity: barcodeInput.length < 8 ? 0.45 : 1 }}
              >
                {isFetching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Look Up Product</Text>
                )}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

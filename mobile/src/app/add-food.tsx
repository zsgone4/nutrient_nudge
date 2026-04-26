import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ScrollView, Pressable, Keyboard, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, X, Plus, Minus, Check, ChevronLeft, Apple, Beef, Milk, Wheat, Droplet, Cookie, ScanBarcode, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { FOOD_DATABASE, searchFoods } from '@/lib/data/foods';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { Food, MealType, FoodCategory, MICRONUTRIENT_INFO, Micronutrients } from '@/lib/types/nutrition';
import { useColorScheme } from '@/lib/useColorScheme';

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
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

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
  } catch {
    return null;
  }
}

export default function AddFoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams<{ mealType?: string; foodId?: string }>();

  const mealType = (params.mealType as MealType) || 'snacks';
  const preselectedFoodId = params.foodId;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(
    preselectedFoodId ? FOOD_DATABASE.find(f => f.id === preselectedFoodId) || null : null
  );
  const [servings, setServings] = useState(1);
  const [showMicroDetails, setShowMicroDetails] = useState(false);

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const addFoodEntry = useNutritionStore(s => s.addFoodEntry);

  const filteredFoods = useMemo(() => {
    if (searchQuery.trim()) return searchFoods(searchQuery);
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
      if (micros[key] > 0) entries.push({ key, value: micros[key], name: MICRONUTRIENT_INFO[key].name });
    });
    return entries.sort((a, b) => b.value - a.value).slice(0, 5);
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

    const food = await fetchProductByBarcode(barcode);
    setIsFetching(false);

    if (food) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBarcodeModal(false);
      setBarcodeInput('');
      setSelectedFood(food);
      setServings(1);
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
      protein: Math.round(macros.protein * servings * 10) / 10,
      carbohydrates: Math.round(macros.carbohydrates * servings * 10) / 10,
      fat: Math.round(macros.fat * servings * 10) / 10,
      fiber: Math.round(macros.fiber * servings * 10) / 10,
      sugar: Math.round(macros.sugar * servings * 10) / 10,
    };
    const topMicros = getTopMicros(selectedFood);

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
            Add to {MEAL_LABELS[mealType]}
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
          </View>

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
                <Text className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round(selectedFood.servingSize * servings)}
                </Text>
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
              Add {scaledMacros.calories} calories
            </Text>
          </Pressable>
        </View>
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
            Add to {MEAL_LABELS[mealType]}
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
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" />
            </Pressable>
          )}
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
                {food.macros.protein}g P
              </Text>
              <Text className="text-xs text-gray-400">
                {food.macros.carbohydrates}g C • {food.macros.fat}g F
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 dark:text-gray-500 text-base">No foods found</Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search term</Text>
          </View>
        }
      />

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
              {/* Handle */}
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

              {/* Large prominent input */}
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

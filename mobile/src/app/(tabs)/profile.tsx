import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Ruler, Weight, Calendar, Activity, Target, Check, ChevronDown, BookOpen, Trash2, Settings, Sliders, RotateCcw, UtensilsCrossed, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useNutritionStore, calculateTDEE, calculateTargetCalories } from '@/lib/state/nutrition-store';
import { useUserStore } from '@/lib/state/user-store';
import {
  Sex,
  ActivityLevel,
  Goal,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  UserProfile,
} from '@/lib/types/nutrition';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

type SetupStep = 'basics' | 'activity' | 'goal' | 'summary';

const profileStyles = StyleSheet.create({
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const userProfile = useNutritionStore(s => s.userProfile);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const macroGoalsOverridden = useNutritionStore(s => s.macroGoalsOverridden);
  const setUserProfile = useNutritionStore(s => s.setUserProfile);
  const setCustomMacroGoals = useNutritionStore(s => s.setCustomMacroGoals);
  const resetMacroGoals = useNutritionStore(s => s.resetMacroGoals);

  const userId = useUserStore(s => s.userId);
  const clearUser = useUserStore(s => s.clearUser);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Custom macro goals modal state
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [customCalories, setCustomCalories] = useState(dailyGoals.macros.calories.toString());
  const [customProtein, setCustomProtein] = useState(dailyGoals.macros.protein.toString());
  const [customCarbs, setCustomCarbs] = useState(dailyGoals.macros.carbohydrates.toString());
  const [customFat, setCustomFat] = useState(dailyGoals.macros.fat.toString());

  const handleOpenMacroModal = () => {
    setCustomCalories(dailyGoals.macros.calories.toString());
    setCustomProtein(dailyGoals.macros.protein.toString());
    setCustomCarbs(dailyGoals.macros.carbohydrates.toString());
    setCustomFat(dailyGoals.macros.fat.toString());
    setShowMacroModal(true);
  };

  const handleCaloriesChange = (value: string) => {
    setCustomCalories(value);
    const newCal = parseInt(value);
    if (!newCal || newCal <= 0) return;
    const p = parseInt(customProtein) || 0;
    const c = parseInt(customCarbs) || 0;
    const f = parseInt(customFat) || 0;
    const currentCal = p * 4 + c * 4 + f * 9;
    if (currentCal > 0) {
      const scale = newCal / currentCal;
      setCustomProtein(Math.round(p * scale).toString());
      setCustomCarbs(Math.round(c * scale).toString());
      setCustomFat(Math.round(f * scale).toString());
    } else {
      setCustomProtein(Math.round(newCal * 0.30 / 4).toString());
      setCustomCarbs(Math.round(newCal * 0.40 / 4).toString());
      setCustomFat(Math.round(newCal * 0.30 / 9).toString());
    }
  };

  const handleMacroChange = (field: 'protein' | 'carbs' | 'fat', value: string) => {
    const p = field === 'protein' ? parseInt(value) || 0 : parseInt(customProtein) || 0;
    const c = field === 'carbs' ? parseInt(value) || 0 : parseInt(customCarbs) || 0;
    const f = field === 'fat' ? parseInt(value) || 0 : parseInt(customFat) || 0;
    setCustomCalories((p * 4 + c * 4 + f * 9).toString());
    if (field === 'protein') setCustomProtein(value);
    else if (field === 'carbs') setCustomCarbs(value);
    else setCustomFat(value);
  };

  const handleSaveMacroGoals = () => {
    const calories = parseInt(customCalories) || dailyGoals.macros.calories;
    const protein = parseInt(customProtein) || dailyGoals.macros.protein;
    const carbohydrates = parseInt(customCarbs) || dailyGoals.macros.carbohydrates;
    const fat = parseInt(customFat) || dailyGoals.macros.fat;
    setCustomMacroGoals({
      calories,
      protein,
      carbohydrates,
      fat,
      fiber: dailyGoals.macros.fiber,
      sugar: dailyGoals.macros.sugar,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMacroModal(false);
  };

  const handleResetMacroGoals = () => {
    resetMacroGoals();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/account/${userId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? 'Failed to delete account');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearUser();
      router.replace('/account-deleted');
    } catch (e: any) {
      setDeleteError(e.message ?? 'Something went wrong');
      setIsDeleting(false);
    }
  };

  // Local state for editing
  const [age, setAge] = useState(userProfile.age.toString());
  const [heightCm, setHeightCm] = useState(userProfile.heightCm.toString());
  const [weightKg, setWeightKg] = useState(userProfile.weightKg.toString());
  const [sex, setSex] = useState<Sex>(userProfile.sex);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(userProfile.activityLevel);
  const [goal, setGoal] = useState<Goal>(userProfile.goal);

  // Setup wizard state
  const [currentStep, setCurrentStep] = useState<SetupStep>(userProfile.isSetup ? 'summary' : 'basics');

  // Calculate preview values
  const previewProfile: UserProfile = {
    age: parseInt(age) || 30,
    heightCm: parseInt(heightCm) || 170,
    weightKg: parseInt(weightKg) || 70,
    sex,
    activityLevel,
    goal,
    isSetup: true,
  };

  const tdee = calculateTDEE(previewProfile);
  const targetCalories = calculateTargetCalories(previewProfile);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserProfile(previewProfile);
    setCurrentStep('summary');
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep('basics');
  };

  // Basics step
  if (currentStep === 'basics') {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Let's get to know you
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">
              We'll use this to calculate your personalized calorie target.
            </Text>

            {/* Sex Selection */}
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sex</Text>
            <View className="flex-row mb-6">
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('male'); }}
                className={`flex-1 py-4 rounded-xl mr-2 items-center ${sex === 'male' ? 'bg-emerald-500' : 'bg-white dark:bg-gray-900'}`}
              >
                <Text className={`font-semibold ${sex === 'male' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Male
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSex('female'); }}
                className={`flex-1 py-4 rounded-xl ml-2 items-center ${sex === 'female' ? 'bg-emerald-500' : 'bg-white dark:bg-gray-900'}`}
              >
                <Text className={`font-semibold ${sex === 'female' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  Female
                </Text>
              </Pressable>
            </View>

            {/* Age */}
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age</Text>
            <View className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl px-4 py-3 mb-6">
              <Calendar size={20} color="#10B981" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
                placeholder="30"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                inputAccessoryViewID={Platform.OS === 'ios' ? 'profileDone' : undefined}
                value={age}
                onChangeText={setAge}
              />
              <Text className="text-gray-400">years</Text>
            </View>

            {/* Height */}
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height</Text>
            <View className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl px-4 py-3 mb-6">
              <Ruler size={20} color="#10B981" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
                placeholder="170"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                inputAccessoryViewID={Platform.OS === 'ios' ? 'profileDone' : undefined}
                value={heightCm}
                onChangeText={setHeightCm}
              />
              <Text className="text-gray-400">cm</Text>
            </View>

            {/* Weight */}
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight</Text>
            <View className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl px-4 py-3 mb-6">
              <Weight size={20} color="#10B981" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
                placeholder="70"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                inputAccessoryViewID={Platform.OS === 'ios' ? 'profileDone' : undefined}
                value={weightKg}
                onChangeText={setWeightKg}
              />
              <Text className="text-gray-400">kg</Text>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCurrentStep('activity'); }}
            className="bg-emerald-500 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold text-base">Continue</Text>
          </Pressable>
        </View>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID="profileDone">
            <View style={profileStyles.doneBar}>
              <Pressable onPress={() => Keyboard.dismiss()} style={profileStyles.doneButton}>
                <Text style={profileStyles.doneText}>Done</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        )}
      </View>
    );
  }

  // Activity step
  if (currentStep === 'activity') {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              How active are you?
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">
              This helps us calculate how many calories you burn daily.
            </Text>

            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level, index) => (
              <View key={level}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActivityLevel(level); }}
                  className={`flex-row items-center p-4 rounded-xl mb-3 ${
                    activityLevel === level
                      ? 'bg-emerald-500'
                      : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <Activity
                    size={24}
                    color={activityLevel === level ? '#ffffff' : '#10B981'}
                  />
                  <Text
                    className={`flex-1 ml-3 font-medium ${
                      activityLevel === level
                        ? 'text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {ACTIVITY_LABELS[level]}
                  </Text>
                  {activityLevel === level && <Check size={20} color="#ffffff" />}
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Buttons */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row">
            <Pressable
              onPress={() => setCurrentStep('basics')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl py-4 items-center mr-2"
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">Back</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCurrentStep('goal'); }}
              className="flex-1 bg-emerald-500 rounded-xl py-4 items-center ml-2"
            >
              <Text className="text-white font-semibold">Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Goal step
  if (currentStep === 'goal') {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              What's your goal?
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">
              We'll adjust your calorie target based on your goal.
            </Text>

            {/* Maintenance Calories Preview */}
            <View className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6">
              <Text className="text-sm text-emerald-700 dark:text-emerald-300">Your maintenance calories (TDEE)</Text>
              <Text className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{tdee} kcal</Text>
            </View>

            {(Object.keys(GOAL_LABELS) as Goal[]).map((g, index) => {
              const info = GOAL_LABELS[g];
              const isSelected = goal === g;

              return (
                <View key={g}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGoal(g); }}
                    className={`p-4 rounded-xl mb-3 ${
                      isSelected ? 'bg-emerald-500' : 'bg-white dark:bg-gray-900'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text
                          className={`font-semibold text-base ${
                            isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {info.title}
                        </Text>
                        <Text
                          className={`text-sm mt-0.5 ${
                            isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {info.description}
                        </Text>
                      </View>
                      {isSelected && <Check size={20} color="#ffffff" />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Buttons */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 pt-4 pb-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="flex-row">
            <Pressable
              onPress={() => setCurrentStep('activity')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl py-4 items-center mr-2"
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 bg-emerald-500 rounded-xl py-4 items-center ml-2"
            >
              <Text className="text-white font-semibold">Save & Finish</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Summary view (when profile is set up)
  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {/* Calorie Target Card */}
          <View className="bg-emerald-500 rounded-2xl p-6 mb-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-white/70 text-sm mb-1">
                  Your Daily Calorie Target
                  {macroGoalsOverridden ? ' (Custom)' : ''}
                </Text>
                <Text className="text-white text-5xl font-bold">{dailyGoals.macros.calories}</Text>
                <Text className="text-white/70 text-base mt-1">kcal per day</Text>
              </View>
              <Pressable
                onPress={handleOpenMacroModal}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Sliders size={16} color="#ffffff" />
              </Pressable>
            </View>

            <View className="flex-row mt-4 pt-4 border-t border-white/20">
              <View className="flex-1">
                <Text className="text-white/70 text-xs">Protein</Text>
                <Text className="text-white font-semibold">{dailyGoals.macros.protein}g</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs">Carbs</Text>
                <Text className="text-white font-semibold">{dailyGoals.macros.carbohydrates}g</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white/70 text-xs">Fat</Text>
                <Text className="text-white font-semibold">{dailyGoals.macros.fat}g</Text>
              </View>
            </View>
          </View>

          {macroGoalsOverridden && (
            <Pressable
              onPress={handleResetMacroGoals}
              className="flex-row items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl py-3 mb-4"
            >
              <RotateCcw size={15} color="#059669" />
              <Text className="text-emerald-700 dark:text-emerald-400 font-medium text-sm ml-2">
                Reset to auto-calculated goals
              </Text>
            </Pressable>
          )}

          {/* Profile Summary Header */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Your Profile</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }}
              className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 items-center justify-center"
            >
              <Settings size={18} color="#10B981" />
            </Pressable>
          </View>
          <View className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden mb-4">
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <User size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Sex</Text>
              <Text className="text-gray-900 dark:text-white font-medium capitalize">{userProfile.sex}</Text>
            </View>
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <Calendar size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Age</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{userProfile.age} years</Text>
            </View>
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <Ruler size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Height</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{userProfile.heightCm} cm</Text>
            </View>
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <Weight size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Weight</Text>
              <Text className="text-gray-900 dark:text-white font-medium">{userProfile.weightKg} kg</Text>
            </View>
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
              <Activity size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Activity</Text>
              <Text className="text-gray-900 dark:text-white font-medium text-right" style={{ maxWidth: 150 }} numberOfLines={1}>
                {ACTIVITY_LABELS[userProfile.activityLevel].split(' (')[0]}
              </Text>
            </View>
            <View className="flex-row items-center p-4">
              <Target size={20} color="#10B981" />
              <Text className="flex-1 ml-3 text-gray-700 dark:text-gray-300">Goal</Text>
              <Text className="text-gray-900 dark:text-white font-medium">
                {GOAL_LABELS[userProfile.goal].title}
              </Text>
            </View>
          </View>

          {/* Saved Meals */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/saved-meals'); }}
            className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl p-4 mt-3"
          >
            <UtensilsCrossed size={18} color="#10B981" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">My Saved Meals</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Edit, manage and delete your meal templates
              </Text>
            </View>
            <ChevronDown size={16} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
          </Pressable>

          {/* Reminders */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/notification-settings'); }}
            className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl p-4 mt-3"
          >
            <Bell size={18} color="#10B981" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">Daily Reminders</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Set times to track meals & check your score
              </Text>
            </View>
            <ChevronDown size={16} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
          </Pressable>

          {/* Edit Button */}
          <Pressable
            onPress={handleEditProfile}
            className="bg-white dark:bg-gray-900 rounded-xl py-4 items-center mt-3"
          >
            <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">Edit Profile</Text>
          </Pressable>

          {/* Delete Account */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDeleteModal(true); }}
            className="flex-row items-center justify-center bg-white dark:bg-gray-900 rounded-xl py-4 mt-3"
          >
            <Trash2 size={16} color="#EF4444" />
            <Text className="text-red-500 font-semibold ml-2">Delete Account</Text>
          </Pressable>

          {/* Info Card */}
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-4">
            <Text className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              How we calculate your calories
            </Text>
            <Text className="text-xs text-blue-700 dark:text-blue-300">
              We use the Mifflin-St Jeor equation to calculate your Basal Metabolic Rate (BMR),
              then multiply by your activity level to get your Total Daily Energy Expenditure (TDEE).
              Your goal adjusts this by {userProfile.goal.includes('cut') ? '-' : userProfile.goal.includes('bulk') ? '+' : ''}
              {Math.abs(userProfile.goal.includes('aggressive') ? 25 : userProfile.goal.includes('conservative') ? 10 : 0)}%.
            </Text>
          </View>

          {/* Sources & Citations */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/sources'); }}
            className="flex-row items-center bg-white dark:bg-gray-900 rounded-xl p-4 mt-3"
          >
            <BookOpen size={18} color="#10B981" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-gray-900 dark:text-white">Sources & Citations</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Scientific references for all health calculations
              </Text>
            </View>
            <ChevronDown size={16} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Custom Macro Goals Modal */}
      <Modal visible={showMacroModal} transparent animationType="slide" onRequestClose={() => setShowMacroModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => Keyboard.dismiss()}
          />
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Customise Goals</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set your own daily macro targets</Text>
              </View>
              <Pressable
                onPress={() => { Keyboard.dismiss(); setShowMacroModal(false); }}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
              >
                <Text className="text-gray-600 dark:text-gray-300 text-base font-bold">✕</Text>
              </Pressable>
            </View>

            {[
              { label: 'Calories', unit: 'kcal', value: customCalories, onChange: handleCaloriesChange },
              { label: 'Protein', unit: 'g', value: customProtein, onChange: (v: string) => handleMacroChange('protein', v) },
              { label: 'Carbs', unit: 'g', value: customCarbs, onChange: (v: string) => handleMacroChange('carbs', v) },
              { label: 'Fat', unit: 'g', value: customFat, onChange: (v: string) => handleMacroChange('fat', v) },
            ].map(({ label, unit, value, onChange }) => (
              <View key={label} className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 mb-3">
                <Text className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  className="text-base font-semibold text-gray-900 dark:text-white text-right mr-1"
                  style={{ minWidth: 60 }}
                />
                <Text className="text-sm text-gray-400">{unit}</Text>
              </View>
            ))}
            <Text className="text-xs text-gray-400 text-center mb-1">
              Editing calories scales macros · editing macros updates calories
            </Text>

            <Pressable
              onPress={() => { Keyboard.dismiss(); handleSaveMacroGoals(); }}
              className="bg-emerald-500 rounded-xl py-4 items-center mt-2"
            >
              <Text className="text-white font-semibold text-base">Save Goals</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">Delete Account?</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                This will permanently delete your account and all associated data. This action cannot be undone.
              </Text>
            </View>

            {deleteError && (
              <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-4">
                <Text className="text-red-600 dark:text-red-400 text-sm text-center">{deleteError}</Text>
              </View>
            )}

            <Pressable
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-500 rounded-xl py-4 items-center mb-3"
            >
              {isDeleting
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold text-base">Yes, Delete My Account</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => { setShowDeleteModal(false); setDeleteError(null); }}
              disabled={isDeleting}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl py-4 items-center"
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

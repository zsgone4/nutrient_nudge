import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Ruler, Weight, Calendar, Activity, Target, Check, ChevronDown } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useNutritionStore, calculateTDEE, calculateTargetCalories } from '@/lib/state/nutrition-store';
import {
  Sex,
  ActivityLevel,
  Goal,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  UserProfile,
} from '@/lib/types/nutrition';

type SetupStep = 'basics' | 'activity' | 'goal' | 'summary';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const userProfile = useNutritionStore(s => s.userProfile);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const setUserProfile = useNutritionStore(s => s.setUserProfile);

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
          <Animated.View entering={FadeInDown.delay(100).springify()} className="p-4">
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
                value={weightKg}
                onChangeText={setWeightKg}
              />
              <Text className="text-gray-400">kg</Text>
            </View>
          </Animated.View>
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
          <Animated.View entering={FadeInDown.delay(100).springify()} className="p-4">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              How active are you?
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mb-6">
              This helps us calculate how many calories you burn daily.
            </Text>

            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level, index) => (
              <Animated.View key={level} entering={FadeInDown.delay(150 + index * 50).springify()}>
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
              </Animated.View>
            ))}
          </Animated.View>
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
          <Animated.View entering={FadeInDown.delay(100).springify()} className="p-4">
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
                <Animated.View key={g} entering={FadeInDown.delay(150 + index * 50).springify()}>
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
                </Animated.View>
              );
            })}
          </Animated.View>
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
        <Animated.View entering={FadeInDown.delay(100).springify()} className="p-4">
          {/* Calorie Target Card */}
          <View className="bg-emerald-500 rounded-2xl p-6 mb-4">
            <Text className="text-white/70 text-sm mb-1">Your Daily Calorie Target</Text>
            <Text className="text-white text-5xl font-bold">{dailyGoals.macros.calories}</Text>
            <Text className="text-white/70 text-base mt-1">kcal per day</Text>

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

          {/* Profile Summary */}
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Profile</Text>
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

          {/* Edit Button */}
          <Pressable
            onPress={handleEditProfile}
            className="bg-white dark:bg-gray-900 rounded-xl py-4 items-center"
          >
            <Text className="text-emerald-600 dark:text-emerald-400 font-semibold">Edit Profile</Text>
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
        </Animated.View>
      </ScrollView>
    </View>
  );
}

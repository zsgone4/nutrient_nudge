import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { MICRONUTRIENT_INFO, Micronutrients } from '@/lib/types/nutrition';

type MicroCategory = 'B Vitamins' | 'Fat-Soluble Vitamins' | 'Water-Soluble Vitamins' | 'Major Minerals' | 'Trace Minerals';

const CATEGORY_ORDER: MicroCategory[] = [
  'B Vitamins',
  'Fat-Soluble Vitamins',
  'Water-Soluble Vitamins',
  'Major Minerals',
  'Trace Minerals',
];

const CATEGORY_COLORS: Record<MicroCategory, { bg: string; text: string; accent: string }> = {
  'B Vitamins': { bg: '#FEF3C7', text: '#92400E', accent: '#F59E0B' },
  'Fat-Soluble Vitamins': { bg: '#DBEAFE', text: '#1E40AF', accent: '#3B82F6' },
  'Water-Soluble Vitamins': { bg: '#D1FAE5', text: '#065F46', accent: '#10B981' },
  'Major Minerals': { bg: '#E0E7FF', text: '#3730A3', accent: '#6366F1' },
  'Trace Minerals': { bg: '#FCE7F3', text: '#9D174D', accent: '#EC4899' },
};

interface NutrientRowProps {
  nutrientKey: keyof Micronutrients;
  current: number;
  goal: number;
  accentColor: string;
}

function NutrientRow({ nutrientKey, current, goal, accentColor }: NutrientRowProps) {
  const [expanded, setExpanded] = useState(false);
  const info = MICRONUTRIENT_INFO[nutrientKey];
  const percentage = goal > 0 ? (current / goal) * 100 : 0;

  const isLow = percentage < 30;
  const isGood = percentage >= 70 && percentage <= 120;
  const isHigh = percentage > 120;

  let statusIcon = null;
  let statusColor = accentColor;

  if (isLow) {
    statusIcon = <AlertTriangle size={14} color="#F59E0B" />;
    statusColor = '#F59E0B';
  } else if (isGood) {
    statusIcon = <CheckCircle size={14} color="#10B981" />;
    statusColor = '#10B981';
  } else if (isHigh) {
    statusIcon = <AlertTriangle size={14} color="#EF4444" />;
    statusColor = '#EF4444';
  }

  const displayCurrent = current < 1 ? current.toFixed(2) : current < 10 ? current.toFixed(1) : Math.round(current);
  const displayGoal = goal < 1 ? goal.toFixed(2) : goal < 10 ? goal.toFixed(1) : Math.round(goal);

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      className="bg-white dark:bg-gray-900 rounded-xl mb-2 overflow-hidden"
    >
      <View className="flex-row items-center p-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">{info.name}</Text>
            {statusIcon && <View className="ml-2">{statusIcon}</View>}
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {displayCurrent} / {displayGoal} {info.unit}
          </Text>
        </View>

        <View className="items-end mr-2">
          <Text className="text-lg font-bold" style={{ color: statusColor }}>
            {Math.round(percentage)}%
          </Text>
        </View>

        {expanded ? (
          <ChevronUp size={18} color="#9CA3AF" />
        ) : (
          <ChevronDown size={18} color="#9CA3AF" />
        )}
      </View>

      {/* Progress bar */}
      <View className="h-1.5 bg-gray-100 dark:bg-gray-800 mx-3 mb-3 rounded-full overflow-hidden">
        <View
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: statusColor,
            height: '100%',
          }}
        />
      </View>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3"
        >
          <View className="flex-row items-start">
            <Info size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 dark:text-gray-400 ml-2 flex-1">
              {info.description}
            </Text>
          </View>

          <View className="flex-row mt-3">
            <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mr-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Current</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                {displayCurrent} {info.unit}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mx-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Goal (RDV)</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                {displayGoal} {info.unit}
              </Text>
            </View>
            <View className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 ml-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Remaining</Text>
              <Text className="text-sm font-semibold" style={{ color: statusColor }}>
                {Math.max(0, goal - current).toFixed(current < 1 ? 2 : 0)} {info.unit}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function MicronutrientsScreen() {
  const insets = useSafeAreaInsets();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['B Vitamins']));

  const selectedDate = useNutritionStore(s => s.selectedDate);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const getTotalsForDate = useNutritionStore(s => s.getTotalsForDate);

  const totals = useMemo(() => getTotalsForDate(selectedDate), [selectedDate, getTotalsForDate]);

  // Group micronutrients by category
  const groupedMicros = useMemo(() => {
    const groups: Record<string, Array<{ key: keyof Micronutrients; current: number; goal: number }>> = {};

    (Object.keys(MICRONUTRIENT_INFO) as (keyof Micronutrients)[]).forEach(key => {
      const info = MICRONUTRIENT_INFO[key];
      const category = info.category;

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push({
        key,
        current: totals.micros[key],
        goal: dailyGoals.micros[key],
      });
    });

    return groups;
  }, [totals, dailyGoals]);

  // Calculate overall micronutrient score
  const overallScore = useMemo(() => {
    let totalPercentage = 0;
    let count = 0;

    (Object.keys(totals.micros) as (keyof Micronutrients)[]).forEach(key => {
      const goal = dailyGoals.micros[key];
      if (goal > 0) {
        const percentage = Math.min((totals.micros[key] / goal) * 100, 100);
        totalPercentage += percentage;
        count++;
      }
    });

    return count > 0 ? Math.round(totalPercentage / count) : 0;
  }, [totals, dailyGoals]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return '#EF4444';
    if (score < 50) return '#F59E0B';
    if (score < 70) return '#10B981';
    return '#059669';
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Score Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm"
        >
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">Overall Micronutrient Score</Text>
          <View className="flex-row items-end">
            <Text className="text-5xl font-bold" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </Text>
            <Text className="text-2xl text-gray-400 mb-1">/100</Text>
          </View>
          <View className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
            <View
              style={{
                width: `${overallScore}%`,
                backgroundColor: getScoreColor(overallScore),
                height: '100%',
                borderRadius: 999,
              }}
            />
          </View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Based on average percentage of daily values met
          </Text>
        </Animated.View>

        {/* Legend */}
        <View className="flex-row justify-center mt-4 mb-2 px-4 flex-wrap">
          <View className="flex-row items-center mr-4 mb-2">
            <View className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">Low (&lt;30%)</Text>
          </View>
          <View className="flex-row items-center mr-4 mb-2">
            <View className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">Good (70-120%)</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <View className="w-3 h-3 rounded-full bg-red-500 mr-1.5" />
            <Text className="text-xs text-gray-500 dark:text-gray-400">High (&gt;120%)</Text>
          </View>
        </View>

        {/* Categories */}
        {CATEGORY_ORDER.map((category, categoryIndex) => {
          const nutrients = groupedMicros[category] || [];
          const colors = CATEGORY_COLORS[category];
          const isExpanded = expandedCategories.has(category);

          return (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(200 + categoryIndex * 100).springify()}
              className="mx-4 mt-4"
            >
              <Pressable
                onPress={() => toggleCategory(category)}
                style={{ backgroundColor: colors.bg }}
                className="flex-row items-center justify-between p-4 rounded-xl"
              >
                <View>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {category}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.text, opacity: 0.7 }}>
                    {nutrients.length} nutrients
                  </Text>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.text} />
                ) : (
                  <ChevronDown size={20} color={colors.text} />
                )}
              </Pressable>

              {isExpanded && (
                <View className="mt-2">
                  {nutrients.map(({ key, current, goal }) => (
                    <NutrientRow
                      key={key}
                      nutrientKey={key}
                      current={current}
                      goal={goal}
                      accentColor={colors.accent}
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* Info Card */}
        <View className="mx-4 mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <View className="flex-row items-start">
            <Info size={18} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-blue-900 dark:text-blue-100">
                About Micronutrients
              </Text>
              <Text className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Micronutrients are vitamins and minerals your body needs in small amounts.
                They're essential for energy production, immune function, blood clotting,
                and other vital processes. Tap any nutrient to learn more.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

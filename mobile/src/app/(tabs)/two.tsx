import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle, BookOpen, Share2, Calculator } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useNutritionStore } from '@/lib/state/nutrition-store';
import { useUserStore } from '@/lib/state/user-store';
import { MICRONUTRIENT_INFO, Micronutrients, FoodLogEntry } from '@/lib/types/nutrition';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

const EMPTY_ENTRIES: FoodLogEntry[] = [];
import { ShareScoreModal } from '@/components/ShareScoreModal';

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
  const isMiddle = !isLow && !isGood && !isHigh;

  let statusIcon = null;
  let statusColor = accentColor;
  let statusBg = '#F3F4F6';
  let statusTextColor = '#374151';
  let statusLabel = '';
  let statusMessage = '';

  if (isLow) {
    statusIcon = <AlertTriangle size={13} color="#92400E" />;
    statusColor = '#F59E0B';
    statusBg = '#FEF3C7';
    statusTextColor = '#92400E';
    statusLabel = 'Too little';
    statusMessage = info.tooLittle;
  } else if (isGood) {
    statusIcon = <CheckCircle size={13} color="#065F46" />;
    statusColor = '#10B981';
    statusBg = '#D1FAE5';
    statusTextColor = '#065F46';
    statusLabel = 'Great level';
    statusMessage = info.enough;
  } else if (isHigh) {
    statusIcon = <AlertTriangle size={13} color="#991B1B" />;
    statusColor = '#EF4444';
    statusBg = '#FEE2E2';
    statusTextColor = '#991B1B';
    statusLabel = 'Too much';
    statusMessage = info.tooMuch;
  } else {
    statusColor = accentColor;
    statusBg = '#F3F4F6';
    statusTextColor = '#374151';
    statusLabel = 'Building up';
    statusMessage = info.enough;
  }

  const displayCurrent = current < 1 ? current.toFixed(2) : current < 10 ? current.toFixed(1) : Math.round(current);
  const displayGoal = goal < 1 ? goal.toFixed(2) : goal < 10 ? goal.toFixed(1) : Math.round(goal);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
      }}
      className="bg-white dark:bg-gray-900 rounded-xl mb-2 overflow-hidden"
    >
      {/* Header */}
      <View className="flex-row items-center px-3 pt-3 pb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">{info.name}</Text>
            {statusIcon && <View className="ml-1.5">{statusIcon}</View>}
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {displayCurrent} / {displayGoal} {info.unit}
          </Text>
        </View>
        <Text className="text-xl font-bold mr-2" style={{ color: statusColor }}>
          {Math.round(percentage)}%
        </Text>
        {expanded ? (
          <ChevronUp size={16} color="#9CA3AF" />
        ) : (
          <ChevronDown size={16} color="#9CA3AF" />
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

      {/* Status message — always visible */}
      <View className="mx-3 mb-2 rounded-lg px-3 py-2 flex-row items-start" style={{ backgroundColor: statusBg }}>
        <View className="mt-0.5 mr-2">{statusIcon}</View>
        <View className="flex-1">
          <Text className="text-xs font-bold mb-0.5" style={{ color: statusTextColor }}>{statusLabel}</Text>
          <Text className="text-xs leading-4" style={{ color: statusTextColor }}>{statusMessage}</Text>
        </View>
      </View>

      {/* Description — always visible */}
      <View className="mx-3 mb-3 flex-row items-start">
        <Info size={12} color="#9CA3AF" style={{ marginTop: 1 }} />
        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 flex-1 leading-4">{info.description}</Text>
      </View>

      {/* Expanded: numeric breakdown */}
      {expanded && (
        <View className="px-3 pb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <View className="flex-row">
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
        </View>
      )}
    </Pressable>
  );
}

export default function MicronutrientsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([]));
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const selectedDate = useNutritionStore(s => s.selectedDate);
  const dailyGoals = useNutritionStore(s => s.dailyGoals);
  const entries = useNutritionStore(s => s.logs[s.selectedDate] ?? EMPTY_ENTRIES);
  const allLogs = useNutritionStore(s => s.logs);
  const userId = useUserStore(s => s.userId);

  const { data: backendHistory } = useQuery({
    queryKey: ['nutrientScoreHistory', userId],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/nutrient-score/history/${userId}?limit=7`);
      if (!res.ok) return null;
      const json = await res.json() as { scores: { date: string; score: number }[] };
      return json.scores;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  const totals = useMemo(() => {
    const macros = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0 };
    const micros: Micronutrients = {
      vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
      vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
      vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
      phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
      selenium: 0, chromium: 0, iodine: 0,
    };
    entries.forEach(entry => {
      const m = entry.servings;
      (Object.keys(macros) as (keyof typeof macros)[]).forEach(k => {
        macros[k] += (entry.food.macros[k] ?? 0) * m;
      });
      (Object.keys(micros) as (keyof Micronutrients)[]).forEach(k => {
        micros[k] += (entry.food.micros[k] ?? 0) * m;
      });
    });
    return { macros, micros };
  }, [entries]);

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

  const weeklyScores = useMemo(() => {
    const result: { date: string; day: string; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const day = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

      // Prefer backend score, fall back to local calculation
      const backendScore = backendHistory?.find(s => s.date === dateStr)?.score;
      if (backendScore !== undefined) {
        result.push({ date: dateStr, day, score: backendScore });
        continue;
      }

      const dayEntries = allLogs[dateStr] ?? [];
      let totalPct = 0;
      let count = 0;
      const micros: Micronutrients = {
        vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
        vitaminB6: 0, vitaminB7: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
        vitaminD: 0, vitaminE: 0, vitaminK: 0, calcium: 0, iron: 0, magnesium: 0,
        phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
        selenium: 0, chromium: 0, iodine: 0,
      };
      dayEntries.forEach(entry => {
        (Object.keys(micros) as (keyof Micronutrients)[]).forEach(k => {
          micros[k] += (entry.food.micros[k] ?? 0) * entry.servings;
        });
      });
      (Object.keys(micros) as (keyof Micronutrients)[]).forEach(k => {
        const goal = dailyGoals.micros[k];
        if (goal > 0) { totalPct += Math.min((micros[k] / goal) * 100, 100); count++; }
      });
      result.push({ date: dateStr, day, score: count > 0 ? Math.round(totalPct / count) : 0 });
    }
    return result;
  }, [allLogs, dailyGoals, backendHistory]);

  const prevScoreRef = useRef<number>(0);

  useEffect(() => {
    const prev = prevScoreRef.current;
    const curr = overallScore;

    if (prev < 25 && curr >= 25) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (prev < 50 && curr >= 50) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (prev < 75 && curr >= 75) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    prevScoreRef.current = curr;
  }, [overallScore]);

  const toggleCategory = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (score < 25) return '#EF4444';
    if (score < 50) return '#F59E0B';
    if (score < 75) return '#10B981';
    return '#059669';
  };

  const getScoreLabel = (score: number) => {
    if (score < 25) return 'Needs Attention';
    if (score < 50) return 'Getting There';
    if (score < 75) return 'Good Progress';
    return 'Excellent!';
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Score Chart */}
        <View className="mx-4 mt-4 mb-3 rounded-2xl p-4 bg-white dark:bg-gray-900" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">7-Day Nutrient Score</Text>
          <View className="flex-row items-end justify-between" style={{ height: 80 }}>
            {weeklyScores.map(({ date, day, score }) => {
              const barColor = getScoreColor(score);
              const isSelected = date === selectedDate;
              const barHeight = score > 0 ? Math.max((score / 100) * 72, 6) : 4;
              return (
                <View key={date} className="flex-1 items-center">
                  <Text className="text-xs font-bold mb-1" style={{ color: isSelected ? barColor : '#9CA3AF' }}>
                    {score > 0 ? score : ''}
                  </Text>
                  <View
                    style={{
                      width: 28,
                      height: barHeight,
                      backgroundColor: score > 0 ? barColor : '#E5E7EB',
                      borderRadius: 6,
                      opacity: isSelected ? 1 : 0.5,
                    }}
                  />
                  <Text className="text-xs mt-1.5" style={{ color: isSelected ? barColor : '#9CA3AF', fontWeight: isSelected ? '700' : '400' }}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            {([{ label: 'Excellent', color: '#059669' }, { label: 'Good', color: '#10B981' }, { label: 'Getting There', color: '#F59E0B' }, { label: 'Low', color: '#EF4444' }] as { label: string; color: string }[]).map(({ label, color }) => (
              <View key={label} className="flex-row items-center">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 4 }} />
                <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Header Score Card */}
        <View
          className="mx-4 mt-1 rounded-2xl p-5 shadow-sm"
          style={{ backgroundColor: getScoreColor(overallScore) + '15', borderWidth: 1.5, borderColor: getScoreColor(overallScore) + '40' }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Daily Score
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShareModalVisible(true);
              }}
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: getScoreColor(overallScore) + '20' }}
            >
              <Share2 size={12} color={getScoreColor(overallScore)} />
              <Text className="text-xs font-semibold ml-1.5" style={{ color: getScoreColor(overallScore) }}>
                Share
              </Text>
            </Pressable>
          </View>
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-end">
                <Text className="text-7xl font-bold" style={{ color: getScoreColor(overallScore) }}>
                  {overallScore}
                </Text>
                <Text className="text-3xl font-light text-gray-400 mb-2">/100</Text>
              </View>
              <View
                className="px-3 py-1 rounded-full self-start mt-1"
                style={{ backgroundColor: getScoreColor(overallScore) + '25' }}
              >
                <Text className="text-sm font-semibold" style={{ color: getScoreColor(overallScore) }}>
                  {getScoreLabel(overallScore)}
                </Text>
              </View>
            </View>
            {/* Milestone badges */}
            <View className="items-end gap-y-2">
              {[75, 50, 25].map(milestone => (
                <View
                  key={milestone}
                  className="flex-row items-center px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: overallScore >= milestone
                      ? getScoreColor(overallScore) + '30'
                      : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{
                      backgroundColor: overallScore >= milestone
                        ? getScoreColor(overallScore)
                        : '#D1D5DB',
                    }}
                  />
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: overallScore >= milestone ? getScoreColor(overallScore) : '#9CA3AF' }}
                  >
                    {milestone}+
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Progress bar with milestone markers */}
          <View className="mt-4">
            <View className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${overallScore}%`,
                  backgroundColor: getScoreColor(overallScore),
                  height: '100%',
                  borderRadius: 999,
                }}
              />
            </View>
            {/* Milestone labels */}
            <View className="flex-row mt-1.5">
              <View style={{ flex: 25 }} />
              <Text className="text-xs text-gray-400" style={{ flex: 0 }}>25</Text>
              <View style={{ flex: 23 }} />
              <Text className="text-xs text-gray-400" style={{ flex: 0 }}>50</Text>
              <View style={{ flex: 23 }} />
              <Text className="text-xs text-gray-400" style={{ flex: 0 }}>75</Text>
              <View style={{ flex: 25 }} />
            </View>
          </View>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Average of daily values met across all micronutrients
          </Text>
        </View>

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
            <View
              key={category}
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
            </View>
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
                Each nutrient shows what happens when you have too little, the right amount, or too much. Tap any nutrient to see your exact numbers.
              </Text>
              <Text className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                Daily values are based on FDA and NIH Dietary Reference Intakes for adults.
              </Text>
            </View>
          </View>
        </View>

        {/* How the score is calculated */}
        <View className="mx-4 mt-3 bg-white dark:bg-gray-900 rounded-xl p-4">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
              <Calculator size={16} color="#10B981" />
            </View>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">How your score is calculated</Text>
          </View>

          <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5 mb-3">
            Your score is the <Text className="font-semibold text-gray-800 dark:text-gray-200">average percentage of recommended daily values (RDVs)</Text> met across all 25 tracked vitamins and minerals — capped at 100% per nutrient so over-consuming one can't inflate the result.
          </Text>

          <View className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium text-center">
              Score = (sum of each nutrient % of RDV, max 100%) ÷ 25
            </Text>
          </View>

          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Are some nutrients weighted more than others?</Text>
          <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5 mb-3">
            No — every vitamin and mineral counts equally. This keeps the score honest and transparent: a score of 75 means you have consistently hit 75% of your targets across the board, with no hidden bias.
          </Text>

          <Text className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Why equal weighting?</Text>
          <Text className="text-xs text-gray-600 dark:text-gray-400 leading-5">
            While certain nutrients like vitamin D, magnesium, and iron are commonly deficient, there is no scientific consensus on a universal ranking — individual needs vary widely by age, sex, activity level, and health goals. Equal weighting gives you a clear, unbiased snapshot of your overall micronutrient coverage.
          </Text>
        </View>

        {/* Sources & Citations */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/sources'); }}
          className="mx-4 mt-3 flex-row items-center bg-white dark:bg-gray-900 rounded-xl p-4"
        >
          <BookOpen size={18} color="#10B981" />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-medium text-gray-900 dark:text-white">Sources & Citations</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Scientific references for daily values & health data
            </Text>
          </View>
          <ChevronDown size={16} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
        </Pressable>
      </ScrollView>

      <ShareScoreModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        score={overallScore}
        scoreColor={getScoreColor(overallScore)}
        scoreLabel={getScoreLabel(overallScore)}
        date={selectedDate}
      />
    </View>
  );
}

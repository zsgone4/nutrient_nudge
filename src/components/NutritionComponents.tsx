import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#10B981',
  backgroundColor = 'rgba(16, 185, 129, 0.15)',
  children,
  className,
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View className={cn('items-center justify-center', className)} style={{ width: size, height: size }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: clampedProgress > 0.25 ? color : 'transparent',
            borderBottomColor: clampedProgress > 0.5 ? color : 'transparent',
            borderLeftColor: clampedProgress > 0.75 ? color : 'transparent',
          }}
        />
      </View>
      <View className="items-center justify-center">
        {children}
      </View>
    </View>
  );
}

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
}

export function MacroBar({ label, current, goal, unit = 'g', color }: MacroBarProps) {
  const progress = Math.min(current / goal, 1);
  const remaining = Math.max(goal - current, 0);

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(current)}/{goal}{unit}
        </Text>
      </View>
      <View className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <View
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: 999,
          }}
        />
      </View>
      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {Math.round(remaining)}{unit} remaining
      </Text>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MealCardProps {
  title: string;
  calories: number;
  itemCount: number;
  icon: React.ReactNode;
  onPress: () => void;
  color: string;
}

export function MealCard({ title, calories, itemCount, icon, onPress, color }: MealCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center">
        <View
          style={{ backgroundColor: `${color}15` }}
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white">{title}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold" style={{ color }}>{calories}</Text>
          <Text className="text-xs text-gray-400">kcal</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

interface NutrientPillProps {
  name: string;
  value: number;
  unit: string;
  percentage: number;
  color?: string;
}

export function NutrientPill({ name, value, unit, percentage, color = '#10B981' }: NutrientPillProps) {
  const displayValue = value < 1 ? value.toFixed(2) : Math.round(value);
  const isLow = percentage < 30;
  const isGood = percentage >= 70 && percentage <= 120;
  const isHigh = percentage > 120;

  let statusColor = color;
  if (isLow) statusColor = '#F59E0B';
  if (isHigh) statusColor = '#EF4444';

  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-3 mr-2 mb-2" style={{ minWidth: 100 }}>
      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1" numberOfLines={1}>{name}</Text>
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        {displayValue}
        <Text className="text-xs font-normal text-gray-400"> {unit}</Text>
      </Text>
      <View className="flex-row items-center mt-1">
        <View className="h-1 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mr-2">
          <View
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: statusColor,
              height: '100%',
            }}
          />
        </View>
        <Text className="text-xs" style={{ color: statusColor }}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
}

interface FoodItemRowProps {
  name: string;
  serving: string;
  calories: number;
  onPress?: () => void;
  onDelete?: () => void;
}

export function FoodItemRow({ name, serving, calories, onPress, onDelete }: FoodItemRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
    >
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900 dark:text-white">{name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{serving}</Text>
      </View>
      <Text className="text-base font-semibold text-emerald-600 dark:text-emerald-400">{calories} kcal</Text>
    </Pressable>
  );
}

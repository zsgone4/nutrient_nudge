import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AccountDeletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withDelay(150, withSpring(1, { damping: 12, stiffness: 180 }));
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentOpacity.value === 0 ? 12 : 0 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
    >
      <Animated.View
        style={iconStyle}
        className="w-32 h-32 rounded-full bg-emerald-50 dark:bg-emerald-900/30 items-center justify-center mb-8"
      >
        <CheckCircle size={60} color="#10B981" strokeWidth={1.5} />
      </Animated.View>

      <Animated.View style={contentStyle} className="items-center">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
          Account Deleted
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-7 mb-3">
          Your account and all associated data have been permanently deleted.
        </Text>
        <Text className="text-sm text-gray-400 dark:text-gray-500 text-center leading-6 mb-14">
          We hope your nutrition journey was a good one. You're always welcome back.
        </Text>
      </Animated.View>

      <Animated.View style={buttonStyle} className="w-full">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/signup');
          }}
          className="bg-emerald-500 rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text className="text-white font-bold text-lg">Start Fresh</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

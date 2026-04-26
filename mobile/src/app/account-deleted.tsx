import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/lib/useColorScheme';

export default function AccountDeletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.delay(150),
      Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 180, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(700),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#030712' : '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          width: 128,
          height: 128,
          borderRadius: 64,
          backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <CheckCircle size={60} color="#10B981" strokeWidth={1.5} />
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: isDark ? '#F9FAFB' : '#111827',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          Account Deleted
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: isDark ? '#9CA3AF' : '#6B7280',
            textAlign: 'center',
            lineHeight: 26,
            marginBottom: 8,
          }}
        >
          Your account and all associated data have been permanently deleted.
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? '#6B7280' : '#9CA3AF',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 56,
          }}
        >
          We hope your nutrition journey was a good one.{'\n'}You're always welcome back.
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: buttonOpacity, width: '100%' }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/signup');
          }}
          style={({ pressed }) => ({
            backgroundColor: '#10B981',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 17 }}>
            Start Fresh
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

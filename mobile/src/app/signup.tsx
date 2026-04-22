import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

import { useUserStore } from '@/lib/state/user-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

const GOALS = [
  { id: 'sleep', label: 'Improve Sleep', emoji: '🌙', desc: 'Better rest & recovery', color: '#8B5CF6' },
  { id: 'recover-perform', label: 'Recover & Perform', emoji: '⚡', desc: 'Athletic performance', color: '#F59E0B' },
  { id: 'hormone-health', label: 'Hormone Health', emoji: '🧬', desc: 'Hormonal balance & wellbeing', color: '#EC4899' },
  { id: 'skin', label: 'Skin Health', emoji: '✨', desc: 'Glow from within', color: '#06B6D4' },
  { id: 'longevity', label: 'Longevity', emoji: '🌿', desc: 'Long-term vitality', color: '#10B981' },
];

const GENDERS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const TOTAL_STEPS = 4;

const STEP_HEADINGS = [
  { title: 'Welcome to\nNutrient Nudge 🌿', sub: 'Tell us a bit about yourself so we can personalise your experience.' },
  { title: 'About you', sub: 'This helps us understand your nutritional needs.' },
  { title: 'What are your\nhealth goals?', sub: 'Select all that apply — we\'ll tailor your recommendations.' },
  { title: "You're almost\nin! 🎉", sub: 'One last step before you start tracking.' },
];

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSignedUp = useUserStore(s => s.setSignedUp);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0: return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      case 1: return age.trim().length > 0 && Number(age) >= 1 && Number(age) <= 120 && gender !== '';
      case 2: return goals.length > 0;
      case 3: return agreedToPolicy;
      default: return false;
    }
  }, [step, name, email, age, gender, goals, agreedToPolicy]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          age: Number(age),
          gender,
          goals,
          agreedToPolicy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Something went wrong');
      return json as { success: boolean; user: { id: string; email: string; name: string } };
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSignedUp(data.user.id, data.user.email);
      router.replace('/(tabs)');
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  const handleNext = () => {
    if (!isStepValid) return;
    setErrorMsg('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      mutation.mutate();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s - 1);
    setErrorMsg('');
  };

  const toggleGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const heading = STEP_HEADINGS[step];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top gradient strip */}
      <LinearGradient
        colors={['#ECFDF5', '#fff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, paddingTop: insets.top }}>

          {/* Progress bar */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
            {step > 0 && (
              <Pressable onPress={handleBack} style={{ marginBottom: 12 }}>
                <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 14 }}>← Back</Text>
              </Pressable>
            )}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 2,
                    backgroundColor: i <= step ? '#10B981' : '#E5E7EB',
                  }}
                />
              ))}
            </View>
            <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 6, fontWeight: '500' }}>
              Step {step + 1} of {TOTAL_STEPS}
            </Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Step heading — animates on step change */}
            <Animated.View key={`heading-${step}`} entering={FadeInDown.springify().damping(22)}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', lineHeight: 38, marginTop: 8, marginBottom: 8 }}>
                {heading?.title}
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 28 }}>
                {heading?.sub}
              </Text>
            </Animated.View>

            {/* Step body */}
            <Animated.View key={`body-${step}`} entering={FadeInDown.delay(80).springify().damping(22)} style={{ flex: 1 }}>

              {/* ── Step 0: Name & Email ── */}
              {step === 0 && (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={labelStyle}>Full name</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="e.g. Alex Johnson"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View>
                    <Text style={labelStyle}>Email address</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              )}

              {/* ── Step 1: Age & Gender ── */}
              {step === 1 && (
                <View style={{ gap: 24 }}>
                  <View>
                    <Text style={labelStyle}>Your age</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAge(a => String(Math.max(1, Number(a) - 1))); }}
                        style={stepperBtn}
                      >
                        <Text style={stepperText}>−</Text>
                      </Pressable>
                      <TextInput
                        style={[inputStyle, { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '700' }]}
                        placeholder="25"
                        placeholderTextColor="#9CA3AF"
                        value={age}
                        onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAge(a => String(Math.min(120, Number(a) + 1))); }}
                        style={stepperBtn}
                      >
                        <Text style={stepperText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View>
                    <Text style={labelStyle}>Gender</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {GENDERS.map(g => {
                        const selected = gender === g.id;
                        return (
                          <Pressable
                            key={g.id}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGender(g.id); }}
                            style={{
                              paddingHorizontal: 18,
                              paddingVertical: 12,
                              borderRadius: 12,
                              borderWidth: 2,
                              borderColor: selected ? '#10B981' : '#E5E7EB',
                              backgroundColor: selected ? '#ECFDF5' : '#F9FAFB',
                            }}
                          >
                            <Text style={{ fontWeight: '600', fontSize: 14, color: selected ? '#059669' : '#374151' }}>
                              {g.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* ── Step 2: Goals ── */}
              {step === 2 && (
                <View style={{ gap: 10 }}>
                  {GOALS.map((goal, i) => {
                    const selected = goals.includes(goal.id);
                    return (
                      <Animated.View
                        key={goal.id}
                        entering={FadeInRight.delay(i * 60).springify().damping(20)}
                      >
                        <Pressable
                          onPress={() => toggleGoal(goal.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 16,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: selected ? goal.color : '#E5E7EB',
                            backgroundColor: selected ? goal.color + '12' : '#F9FAFB',
                          }}
                        >
                          <Text style={{ fontSize: 26, marginRight: 14 }}>{goal.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '700', fontSize: 15, color: '#111827' }}>{goal.label}</Text>
                            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{goal.desc}</Text>
                          </View>
                          <View style={{
                            width: 24, height: 24, borderRadius: 12,
                            borderWidth: 2,
                            borderColor: selected ? goal.color : '#D1D5DB',
                            backgroundColor: selected ? goal.color : 'transparent',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selected && <Check size={13} color="white" />}
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}

              {/* ── Step 3: Policy ── */}
              {step === 3 && (
                <View style={{ gap: 20 }}>
                  {/* Summary card */}
                  <View style={{ backgroundColor: '#F9FAFB', borderRadius: 16, padding: 18, gap: 10 }}>
                    <SummaryRow label="Name" value={name} />
                    <SummaryRow label="Email" value={email} />
                    <SummaryRow label="Age" value={`${age} years old`} />
                    <SummaryRow label="Gender" value={GENDERS.find(g => g.id === gender)?.label ?? gender} />
                    <SummaryRow
                      label="Goals"
                      value={goals.map(id => GOALS.find(g => g.id === id)?.label ?? id).join(', ')}
                    />
                  </View>

                  {/* Policy checkbox */}
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgreedToPolicy(v => !v); }}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
                  >
                    <View style={{
                      width: 24, height: 24, borderRadius: 6, marginTop: 1,
                      borderWidth: 2,
                      borderColor: agreedToPolicy ? '#10B981' : '#D1D5DB',
                      backgroundColor: agreedToPolicy ? '#10B981' : 'white',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {agreedToPolicy && <Check size={14} color="white" />}
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 21 }}>
                      I agree to the{' '}
                      <Text style={{ color: '#10B981', fontWeight: '600' }}>Nutrient Nudge Privacy Policy</Text>
                      {' '}and consent to my data being used to improve the app experience.
                    </Text>
                  </Pressable>
                </View>
              )}

            </Animated.View>
          </ScrollView>

          {/* Error message */}
          {!!errorMsg && (
            <View style={{ marginHorizontal: 24, marginBottom: 10, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 }}>
              <Text style={{ color: '#DC2626', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>
            </View>
          )}

          {/* Continue / Submit button */}
          <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 8 }}>
            <Pressable
              onPress={handleNext}
              disabled={!isStepValid || mutation.isPending}
              style={({ pressed }) => ({
                paddingVertical: 18,
                borderRadius: 16,
                backgroundColor: isStepValid ? '#10B981' : '#E5E7EB',
                alignItems: 'center',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{
                  color: isStepValid ? 'white' : '#9CA3AF',
                  fontWeight: '700',
                  fontSize: 17,
                }}>
                  {step < TOTAL_STEPS - 1 ? 'Continue' : 'Create Account'}
                </Text>
              )}
            </Pressable>
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500', width: 60 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' }} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: '600' as const,
  color: '#374151',
  marginBottom: 8,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};

const inputStyle = {
  backgroundColor: '#F9FAFB',
  borderWidth: 2,
  borderColor: '#E5E7EB',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16,
  color: '#111827',
  fontWeight: '500' as const,
};

const stepperBtn = {
  width: 50,
  height: 56,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const stepperText = {
  fontSize: 22,
  fontWeight: '600' as const,
  color: '#374151',
};

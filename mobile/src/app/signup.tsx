import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight, Bell, BellOff, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useUserStore } from '@/lib/state/user-store';
import { useNutritionStore } from '@/lib/state/nutrition-store';
import { log } from '@/lib/logger';
import {
  ReminderConfig,
  DEFAULT_REMINDERS,
  saveNotificationSettings,
  requestNotificationPermissions,
} from '@/lib/utils/notificationSettings';

import { BACKEND_URL } from '@/lib/config';

const C = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceAlt: '#222222',
  border: '#2A2A2A',
  borderAlt: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#555555',
  green: '#10B981',
  greenDark: '#059669',
  greenDim: 'rgba(16,185,129,0.15)',
  greenDimBorder: 'rgba(16,185,129,0.35)',
};

const TRAINING_GOALS = [
  { id: 'longevity', label: 'Longevity', emoji: '🌿', desc: 'Live longer, feel younger', color: '#10B981' },
  { id: 'fat-loss', label: 'Fat Loss', emoji: '🔥', desc: 'Burn fat, stay lean', color: '#F97316' },
  { id: 'build-muscle', label: 'Build Muscle', emoji: '💪', desc: 'Strength & size gains', color: '#3B82F6' },
  { id: 'mobility', label: 'Mobility & Functionality', emoji: '🤸', desc: 'Move better, feel free', color: '#A855F7' },
  { id: 'mental-health', label: 'Mental Health & Stress Relief', emoji: '🧠', desc: 'Calm, clarity & resilience', color: '#06B6D4' },
  { id: 'hybrid-athlete', label: 'Hybrid Athlete (Hyrox)', emoji: '⚡', desc: 'Strength meets endurance', color: '#F59E0B' },
  { id: 'endurance', label: 'Endurance (Marathon)', emoji: '🏃', desc: 'Go the distance', color: '#EF4444' },
];

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

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary', emoji: '🪑', desc: 'Desk job, little or no exercise', mult: 1.2 },
  { id: 'light', label: 'Lightly Active', emoji: '🚶', desc: '1–3 days exercise per week', mult: 1.375 },
  { id: 'moderate', label: 'Moderately Active', emoji: '🏃', desc: '3–5 days exercise per week', mult: 1.55 },
  { id: 'active', label: 'Very Active', emoji: '💪', desc: '6–7 days exercise per week', mult: 1.725 },
  { id: 'very_active', label: 'Extremely Active', emoji: '🔥', desc: 'Intense daily training or physical job', mult: 1.9 },
];

const FITNESS_GOALS = [
  { id: 'aggressive_cut', label: 'Aggressive Cut', emoji: '🔥', desc: 'Lose fat fast (−25% calories)', color: '#EF4444', adj: -0.25 },
  { id: 'conservative_cut', label: 'Steady Cut', emoji: '📉', desc: 'Lean down gradually (−10%)', color: '#F59E0B', adj: -0.10 },
  { id: 'maintain', label: 'Maintain', emoji: '⚖️', desc: 'Keep your current physique', color: '#10B981', adj: 0 },
  { id: 'conservative_bulk', label: 'Lean Bulk', emoji: '💪', desc: 'Build lean muscle (+10%)', color: '#3B82F6', adj: 0.10 },
  { id: 'aggressive_bulk', label: 'Aggressive Bulk', emoji: '🏋️', desc: 'Maximise muscle gains (+25%)', color: '#8B5CF6', adj: 0.25 },
];

const TOTAL_STEPS = 10;

const STEP_HEADINGS = [
  { title: 'Welcome to\nNutrient Nudge 🌿', sub: 'Tell us about yourself so we can personalise your experience.' },
  { title: 'About you', sub: 'This helps us understand your nutritional needs.' },
  { title: 'Your measurements 📏', sub: 'Used to calculate your personalised calorie target.' },
  { title: 'Activity level 🏃', sub: 'How active are you on a typical week?' },
  { title: 'Body goal 🎯', sub: 'What do you want to achieve with your physique?' },
  { title: 'Training focus 💪', sub: "Pick your main focus — we'll build your plan around it." },
  { title: 'Health goals', sub: "Select all that apply — we'll tailor your recommendations." },
  { title: 'Your calorie\ntarget 🔢', sub: "Based on your data, here's what we recommend." },
  { title: 'Stay on track 🔔', sub: 'Set daily reminders to log your meals — you can change these anytime.' },
  { title: 'Almost there! 🎉', sub: 'Review your details before getting started.' },
];

// ─── Calorie calculation helpers ─────────────────────────────────────────────
function calcRecommendedCalories(
  ageVal: number, heightVal: number, weightVal: number,
  sex: 'male' | 'female', actLevel: string, fitGoal: string
): number {
  const bmr = sex === 'male'
    ? 10 * weightVal + 6.25 * heightVal - 5 * ageVal + 5
    : 10 * weightVal + 6.25 * heightVal - 5 * ageVal - 161;
  const mult = ACTIVITY_OPTIONS.find(a => a.id === actLevel)?.mult ?? 1.55;
  const adj = FITNESS_GOALS.find(g => g.id === fitGoal)?.adj ?? 0;
  return Math.round(bmr * mult * (1 + adj));
}

function calcMacros(calories: number, weightKgVal: number) {
  const protein = Math.round(weightKgVal * 1.8);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setSignedUp = useUserStore(s => s.setSignedUp);
  const setUserProfile = useNutritionStore(s => s.setUserProfile);
  const setCustomMacroGoals = useNutritionStore(s => s.setCustomMacroGoals);

  const [step, setStep] = useState(0);

  // Step 0
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Step 1
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('');
  // Step 2
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('70');
  // Step 3
  const [activityLevel, setActivityLevel] = useState('');
  // Step 4
  const [fitnessGoal, setFitnessGoal] = useState('');
  // Step 5
  const [trainingGoal, setTrainingGoal] = useState('');
  // Step 6
  const [goals, setGoals] = useState<string[]>([]);
  // Step 7
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  // Step 8: meal reminders
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminders, setReminders] = useState<ReminderConfig[]>(DEFAULT_REMINDERS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  // Step 9
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const emailRef = useRef<TextInput>(null);

  const sexForCalc: 'male' | 'female' = gender === 'female' ? 'female' : 'male';

  const recommendedCalories = useMemo(() => {
    if (!activityLevel || !fitnessGoal) return 2000;
    return calcRecommendedCalories(
      Number(age) || 25,
      Number(heightCm) || 170,
      Number(weightKg) || 70,
      sexForCalc,
      activityLevel,
      fitnessGoal
    );
  }, [age, heightCm, weightKg, sexForCalc, activityLevel, fitnessGoal]);

  // Initialise customCalories when user arrives at step 7
  useEffect(() => {
    if (step === 7 && customCalories === null) {
      setCustomCalories(recommendedCalories);
    }
  }, [step]);

  const displayCalories = customCalories ?? recommendedCalories;
  const macros = calcMacros(displayCalories, Number(weightKg) || 70);

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0: return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      case 1: return age.trim().length > 0 && Number(age) >= 1 && Number(age) <= 120 && gender !== '';
      case 2: return Number(heightCm) >= 100 && Number(heightCm) <= 250 && Number(weightKg) >= 20 && Number(weightKg) <= 300;
      case 3: return activityLevel !== '';
      case 4: return fitnessGoal !== '';
      case 5: return trainingGoal !== '';
      case 6: return goals.length > 0;
      case 7: return true;
      case 8: return true; // reminders are optional
      case 9: return agreedToPolicy;
      default: return false;
    }
  }, [step, name, email, age, gender, heightCm, weightKg, activityLevel, fitnessGoal, trainingGoal, goals, agreedToPolicy]);

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
          trainingGoal,
          goals,
          agreedToPolicy,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Something went wrong');
      return json as { success: boolean; user: { id: string; email: string; name: string } };
    },
    onSuccess: (data) => {
      // Save body profile to nutrition store
      setUserProfile({
        age: Number(age),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        sex: sexForCalc,
        activityLevel: activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
        goal: fitnessGoal as 'aggressive_cut' | 'conservative_cut' | 'maintain' | 'conservative_bulk' | 'aggressive_bulk',
        isSetup: true,
      });

      // If user amended calories, apply custom macro goals
      if (customCalories !== null && customCalories !== recommendedCalories) {
        const wKg = Number(weightKg) || 70;
        const { protein, fat, carbs } = calcMacros(customCalories, wKg);
        setCustomMacroGoals({
          calories: customCalories,
          protein,
          carbohydrates: carbs,
          fat,
          fiber: Math.round((customCalories / 1000) * 14),
          sugar: Math.round((customCalories * 0.08) / 4),
        });
      }

      // Save & schedule the user's chosen meal reminders (stored locally on device,
      // not sent to the backend). This also requests notification permission.
      saveNotificationSettings({ enabled: remindersEnabled, reminders }).catch(() => {});

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 320);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 500);
      setTimeout(() => {
        setSignedUp(data.user.id, data.user.email, {
          userName: name.trim(),
          userAge: age,
          userGender: gender,
          userTrainingGoal: trainingGoal,
          userGoals: goals,
        });
        router.replace('/(tabs)');
      }, 600);
    },
    onError: (err: Error) => {
      log.error("signup.failed", { err, email: email.trim().toLowerCase() });
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

  const adjustCalories = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomCalories(prev => Math.max(800, Math.min(6000, (prev ?? recommendedCalories) + delta)));
  };

  // ── Reminder step helpers ──
  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  const toggleRemindersMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) await requestNotificationPermissions();
    setRemindersEnabled(val);
  };

  const toggleReminder = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReminders(prev => prev.map(r => r.key === key ? { ...r, enabled: !r.enabled } : r));
  };

  const openTimePicker = (key: string) => {
    const r = reminders.find(rr => rr.key === key);
    if (!r) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date();
    d.setHours(r.hour, r.minute, 0, 0);
    setPickerDate(d);
    setPickerKey(key);
    setPickerOpen(true);
  };

  const handleTimeChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (!date || !pickerKey) return;
      setReminders(prev => prev.map(r =>
        r.key === pickerKey ? { ...r, hour: date.getHours(), minute: date.getMinutes() } : r
      ));
      return;
    }
    if (!date) return;
    setPickerDate(date);
    if (pickerKey) {
      setReminders(prev => prev.map(r =>
        r.key === pickerKey ? { ...r, hour: date.getHours(), minute: date.getMinutes() } : r
      ));
    }
  };

  const confirmIOSTime = () => setPickerOpen(false);

  const heading = STEP_HEADINGS[step];
  const activityLabel = ACTIVITY_OPTIONS.find(a => a.id === activityLevel)?.label ?? '';
  const fitnessLabel = FITNESS_GOALS.find(g => g.id === fitnessGoal)?.label ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={['rgba(16,185,129,0.12)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 4 }}>
          {step > 0 ? (
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: C.surface,
                borderWidth: 1, borderColor: C.border,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ChevronLeft size={20} color={C.textSecondary} />
            </Pressable>
          ) : (
            <View style={{ height: 56 }} />
          )}

          {/* Progress bars */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 3, flex: 1, borderRadius: 2,
                  backgroundColor: i <= step ? C.green : C.border,
                }}
              />
            ))}
          </View>
          <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 6, fontWeight: '600', letterSpacing: 0.4 }}>
            STEP {step + 1} OF {TOTAL_STEPS}
          </Text>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View key={`heading-${step}`}>
            <Text style={{ fontSize: 34, fontWeight: '800', color: C.textPrimary, lineHeight: 42, marginTop: 20, marginBottom: 6 }}>
              {heading.title}
            </Text>
            <Text style={{ fontSize: 15, color: C.textSecondary, lineHeight: 22, marginBottom: 32 }}>
              {heading.sub}
            </Text>
          </View>

          <View key={`body-${step}`}>

            {/* ── Step 0: Name & Email ── */}
            {step === 0 && (
              <View style={card}>
                <Text style={fieldLabel}>Full name</Text>
                <TextInput
                  style={fieldInput}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor={C.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                  selectionColor={C.green}
                />
                <View style={{ height: 1, backgroundColor: C.border, marginVertical: 16 }} />
                <Text style={fieldLabel}>Email address</Text>
                <TextInput
                  ref={emailRef}
                  style={fieldInput}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  selectionColor={C.green}
                />
              </View>
            )}

            {/* ── Step 1: Age & Gender ── */}
            {step === 1 && (
              <View style={{ gap: 14 }}>
                <View style={card}>
                  <Text style={fieldLabel}>Your age</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAge(a => String(Math.max(1, Number(a || '1') - 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>−</Text>
                    </Pressable>
                    <TextInput
                      style={[fieldInput, { flex: 1, textAlign: 'center', fontSize: 32, fontWeight: '800', paddingVertical: 10 }]}
                      placeholder="25"
                      placeholderTextColor={C.textMuted}
                      value={age}
                      onChangeText={v => setAge(v.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={3}
                      selectionColor={C.green}
                    />
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAge(a => String(Math.min(120, Number(a || '0') + 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={card}>
                  <Text style={fieldLabel}>Gender</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                    {GENDERS.map(g => {
                      const sel = gender === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGender(g.id); }}
                          style={{
                            paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: sel ? C.green : C.border,
                            backgroundColor: sel ? C.greenDim : C.surfaceAlt,
                          }}
                        >
                          <Text style={{ fontWeight: '600', fontSize: 14, color: sel ? C.green : C.textSecondary }}>
                            {g.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ── Step 2: Height & Weight ── */}
            {step === 2 && (
              <View style={{ gap: 14 }}>
                <View style={card}>
                  <Text style={fieldLabel}>Height</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHeightCm(h => String(Math.max(100, Number(h || '170') - 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>−</Text>
                    </Pressable>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <TextInput
                        style={[fieldInput, { width: '100%', textAlign: 'center', fontSize: 32, fontWeight: '800', paddingVertical: 10 }]}
                        value={heightCm}
                        onChangeText={v => setHeightCm(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={3}
                        selectionColor={C.green}
                      />
                      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 }}>cm</Text>
                    </View>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHeightCm(h => String(Math.min(250, Number(h || '170') + 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={card}>
                  <Text style={fieldLabel}>Weight</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeightKg(w => String(Math.max(20, Number(w || '70') - 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>−</Text>
                    </Pressable>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <TextInput
                        style={[fieldInput, { width: '100%', textAlign: 'center', fontSize: 32, fontWeight: '800', paddingVertical: 10 }]}
                        value={weightKg}
                        onChangeText={v => setWeightKg(v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={3}
                        selectionColor={C.green}
                      />
                      <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600', marginTop: 4 }}>kg</Text>
                    </View>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWeightKg(w => String(Math.min(300, Number(w || '70') + 1))); }}
                      style={stepperBtn}
                    >
                      <Text style={stepperTxt}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* ── Step 3: Activity Level ── */}
            {step === 3 && (
              <View style={{ gap: 10 }}>
                {ACTIVITY_OPTIONS.map(opt => {
                  const sel = activityLevel === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActivityLevel(opt.id); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 16,
                        borderRadius: 16, borderWidth: 1.5,
                        borderColor: sel ? C.greenDimBorder : C.border,
                        backgroundColor: sel ? C.greenDim : C.surface,
                      }}
                    >
                      <Text style={{ fontSize: 26, marginRight: 14 }}>{opt.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: C.textPrimary }}>{opt.label}</Text>
                        <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{opt.desc}</Text>
                      </View>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13, borderWidth: 2,
                        borderColor: sel ? C.green : C.borderAlt,
                        backgroundColor: sel ? C.green : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Step 4: Fitness / Body Goal ── */}
            {step === 4 && (
              <View style={{ gap: 10 }}>
                {FITNESS_GOALS.map(fg => {
                  const sel = fitnessGoal === fg.id;
                  return (
                    <Pressable
                      key={fg.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFitnessGoal(fg.id); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 16,
                        borderRadius: 16, borderWidth: 1.5,
                        borderColor: sel ? fg.color + '80' : C.border,
                        backgroundColor: sel ? fg.color + '15' : C.surface,
                      }}
                    >
                      <Text style={{ fontSize: 26, marginRight: 14 }}>{fg.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: C.textPrimary }}>{fg.label}</Text>
                        <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{fg.desc}</Text>
                      </View>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13, borderWidth: 2,
                        borderColor: sel ? fg.color : C.borderAlt,
                        backgroundColor: sel ? fg.color : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Step 5: Training Goal ── */}
            {step === 5 && (
              <View style={{ gap: 10 }}>
                {TRAINING_GOALS.map(tg => {
                  const sel = trainingGoal === tg.id;
                  return (
                    <Pressable
                      key={tg.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTrainingGoal(tg.id); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 16,
                        borderRadius: 16, borderWidth: 1.5,
                        borderColor: sel ? tg.color + '80' : C.border,
                        backgroundColor: sel ? tg.color + '15' : C.surface,
                      }}
                    >
                      <Text style={{ fontSize: 26, marginRight: 14 }}>{tg.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: C.textPrimary }}>{tg.label}</Text>
                        <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{tg.desc}</Text>
                      </View>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13, borderWidth: 2,
                        borderColor: sel ? tg.color : C.borderAlt,
                        backgroundColor: sel ? tg.color : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Step 6: Health Goals ── */}
            {step === 6 && (
              <View style={{ gap: 10 }}>
                {GOALS.map(goal => {
                  const sel = goals.includes(goal.id);
                  return (
                    <Pressable
                      key={goal.id}
                      onPress={() => toggleGoal(goal.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 16,
                        borderRadius: 16, borderWidth: 1.5,
                        borderColor: sel ? goal.color + '80' : C.border,
                        backgroundColor: sel ? goal.color + '15' : C.surface,
                      }}
                    >
                      <Text style={{ fontSize: 26, marginRight: 14 }}>{goal.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15, color: C.textPrimary }}>{goal.label}</Text>
                        <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{goal.desc}</Text>
                      </View>
                      <View style={{
                        width: 26, height: 26, borderRadius: 13, borderWidth: 2,
                        borderColor: sel ? goal.color : C.borderAlt,
                        backgroundColor: sel ? goal.color : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Check size={14} color="white" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Step 7: Calorie Recommendation ── */}
            {step === 7 && (
              <View style={{ gap: 14 }}>
                {/* Big calorie card */}
                <LinearGradient
                  colors={[C.greenDark + 'CC', C.green + '99']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 24, alignItems: 'center' }}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Daily Calorie Target
                  </Text>
                  <Text style={{ color: 'white', fontSize: 72, fontWeight: '900', lineHeight: 80 }}>
                    {displayCalories.toLocaleString()}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                    calories per day
                  </Text>

                  {/* Macro breakdown */}
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', width: '100%', justifyContent: 'center' }}>
                    {[
                      { label: 'Protein', value: `${macros.protein}g`, color: '#FCD34D' },
                      { label: 'Carbs', value: `${macros.carbs}g`, color: '#A7F3D0' },
                      { label: 'Fat', value: `${macros.fat}g`, color: '#FCA5A5' },
                    ].map(m => (
                      <View key={m.label} style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ color: m.color, fontSize: 18, fontWeight: '800' }}>{m.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{m.label}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>

                {/* Basis info */}
                <View style={[card, { gap: 8 }]}>
                  <Text style={fieldLabel}>Based on your profile</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: C.textSecondary, fontSize: 13 }}>Activity level</Text>
                    <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '600' }}>{activityLabel}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: C.textSecondary, fontSize: 13 }}>Body goal</Text>
                    <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: '600' }}>{fitnessLabel}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: C.textSecondary, fontSize: 13 }}>Formula</Text>
                    <Text style={{ color: C.textSecondary, fontSize: 12 }}>Mifflin-St Jeor BMR</Text>
                  </View>
                </View>

                {/* Adjust target */}
                <View style={card}>
                  <Text style={fieldLabel}>Adjust your target</Text>
                  <Text style={{ color: C.textSecondary, fontSize: 13, marginBottom: 14 }}>
                    Fine-tune if you already know your preferred intake.
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Pressable
                      onPress={() => adjustCalories(-50)}
                      style={[stepperBtn, { flex: 1, width: 'auto' }]}
                    >
                      <Text style={{ color: C.textSecondary, fontSize: 16, fontWeight: '700' }}>− 50</Text>
                    </Pressable>
                    <View style={{ flex: 2, alignItems: 'center' }}>
                      <Text style={{ color: C.green, fontSize: 26, fontWeight: '900' }}>{displayCalories.toLocaleString()}</Text>
                      <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '600' }}>kcal / day</Text>
                    </View>
                    <Pressable
                      onPress={() => adjustCalories(50)}
                      style={[stepperBtn, { flex: 1, width: 'auto' }]}
                    >
                      <Text style={{ color: C.textSecondary, fontSize: 16, fontWeight: '700' }}>+ 50</Text>
                    </Pressable>
                  </View>
                  {customCalories !== null && customCalories !== recommendedCalories && (
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCustomCalories(recommendedCalories); }}
                      style={{ marginTop: 12, alignItems: 'center' }}
                    >
                      <Text style={{ color: C.green, fontSize: 13, fontWeight: '600' }}>
                        Reset to recommended ({recommendedCalories.toLocaleString()} kcal)
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  You can always change this later in your Profile settings.
                </Text>
              </View>
            )}

            {/* ── Step 8: Meal Reminders ── */}
            {step === 8 && (
              <View style={{ gap: 12 }}>
                {/* Master toggle */}
                <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={{
                      width: 42, height: 42, borderRadius: 13,
                      backgroundColor: remindersEnabled ? C.greenDim : C.surfaceAlt,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {remindersEnabled
                        ? <Bell size={19} color={C.green} />
                        : <BellOff size={19} color={C.textMuted} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>Meal reminders</Text>
                      <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        {remindersEnabled ? 'Get nudged to log each meal' : 'Reminders are off'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={remindersEnabled}
                    onValueChange={toggleRemindersMaster}
                    trackColor={{ false: '#333', true: C.green }}
                    thumbColor="white"
                  />
                </View>

                {/* Per-meal cards */}
                {reminders.map(r => {
                  const isActive = remindersEnabled && r.enabled;
                  return (
                    <View
                      key={r.key}
                      style={{
                        backgroundColor: C.surface, borderRadius: 16,
                        borderWidth: 1, borderColor: isActive ? C.greenDimBorder : C.border,
                        overflow: 'hidden', opacity: remindersEnabled ? 1 : 0.45,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                        <Text style={{ fontSize: 24, marginRight: 12 }}>{r.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>{r.label}</Text>
                          <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{r.description}</Text>
                        </View>
                        <Switch
                          value={r.enabled}
                          onValueChange={() => toggleReminder(r.key)}
                          trackColor={{ false: '#333', true: C.green }}
                          thumbColor="white"
                          disabled={!remindersEnabled}
                        />
                      </View>
                      <Pressable
                        onPress={() => isActive ? openTimePicker(r.key) : undefined}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          paddingHorizontal: 16, paddingVertical: 13,
                          borderTopWidth: 1, borderTopColor: C.border,
                          backgroundColor: isActive ? 'rgba(16,185,129,0.06)' : 'transparent',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Clock size={14} color={isActive ? C.green : C.textMuted} />
                          <Text style={{ fontSize: 13, color: C.textSecondary, fontWeight: '600' }}>Time</Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: isActive ? C.green : C.textMuted }}>
                          {formatTime(r.hour, r.minute)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}

                <Text style={{ color: C.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 }}>
                  You can change or turn these off anytime in Settings.
                </Text>
              </View>
            )}

            {/* ── Step 9: Review & Policy ── */}
            {step === 9 && (
              <View style={{ gap: 14 }}>
                <View style={card}>
                  <Text style={[fieldLabel, { marginBottom: 16 }]}>Your details</Text>
                  <SummaryRow label="Name" value={name} />
                  <DividerLine />
                  <SummaryRow label="Email" value={email} />
                  <DividerLine />
                  <SummaryRow label="Age" value={`${age} years old`} />
                  <DividerLine />
                  <SummaryRow label="Gender" value={GENDERS.find(g => g.id === gender)?.label ?? gender} />
                  <DividerLine />
                  <SummaryRow label="Height" value={`${heightCm} cm`} />
                  <DividerLine />
                  <SummaryRow label="Weight" value={`${weightKg} kg`} />
                  <DividerLine />
                  <SummaryRow label="Activity" value={activityLabel} />
                  <DividerLine />
                  <SummaryRow label="Goal" value={fitnessLabel} />
                  <DividerLine />
                  <SummaryRow label="Calories" value={`${displayCalories.toLocaleString()} kcal/day`} />
                  <DividerLine />
                  <SummaryRow
                    label="Training"
                    value={(() => { const t = TRAINING_GOALS.find(t => t.id === trainingGoal); return t ? `${t.emoji} ${t.label}` : trainingGoal; })()}
                  />
                  <DividerLine />
                  <SummaryRow
                    label="Health"
                    value={goals.map(id => GOALS.find(g => g.id === id)?.label ?? id).join(', ')}
                  />
                </View>

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgreedToPolicy(v => !v); }}
                  style={[card, { flexDirection: 'row', alignItems: 'flex-start', gap: 14 }]}
                >
                  <View style={{
                    width: 26, height: 26, borderRadius: 8, marginTop: 1,
                    borderWidth: 2,
                    borderColor: agreedToPolicy ? C.green : C.borderAlt,
                    backgroundColor: agreedToPolicy ? C.green : 'transparent',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {agreedToPolicy && <Check size={14} color="white" />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: C.textSecondary, lineHeight: 21 }}>
                    I agree to the{' '}
                    <Text style={{ color: C.green, fontWeight: '600' }}>Nutrient Nudge Privacy Policy</Text>
                    {' '}and consent to my data being used to improve the app experience.
                  </Text>
                </Pressable>
              </View>
            )}

          </View>
        </ScrollView>

        {/* Error */}
        {!!errorMsg && (
          <View style={{
            marginHorizontal: 20, marginBottom: 8,
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
            borderRadius: 12, padding: 12,
          }}>
            <Text style={{ color: '#F87171', fontSize: 13, textAlign: 'center' }}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Continue / Submit ── */}
        <View style={{
          paddingHorizontal: 20, paddingBottom: insets.bottom + 12, paddingTop: 12,
          backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
        }}>
          <Pressable
            onPress={handleNext}
            disabled={!isStepValid || mutation.isPending}
            style={({ pressed }) => ({ borderRadius: 16, overflow: 'hidden', opacity: pressed ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={isStepValid ? [C.greenDark, C.green] : [C.surface, C.surface]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 17, borderRadius: 16,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                borderWidth: isStepValid ? 0 : 1, borderColor: C.border,
              }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={{ color: isStepValid ? 'white' : C.textMuted, fontWeight: '700', fontSize: 17 }}>
                    {step < TOTAL_STEPS - 1 ? (step === 7 ? 'Looks good, continue' : 'Continue') : 'Create Account'}
                  </Text>
                  {step < TOTAL_STEPS - 1 && isStepValid && (
                    <ChevronRight size={18} color="white" />
                  )}
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── iOS time picker sheet ── */}
      {Platform.OS === 'ios' && (
        <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <View style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 20, paddingBottom: insets.bottom + 24,
              borderTopWidth: 1, borderColor: C.border,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
                  <Text style={{ color: C.textSecondary, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </Pressable>
                <Text style={{ color: C.textPrimary, fontSize: 16, fontWeight: '700' }}>Set Time</Text>
                <Pressable onPress={confirmIOSTime} hitSlop={10}>
                  <Text style={{ color: C.green, fontSize: 16, fontWeight: '700' }}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                textColor="white"
                style={{ height: 160 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* ── Android time picker ── */}
      {Platform.OS === 'android' && pickerOpen && (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

function DividerLine() {
  return <View style={{ height: 1, backgroundColor: '#1F1F1F', marginVertical: 10 }} />;
}

function SummaryRow({ label: lbl, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Text style={{ fontSize: 13, color: C.textMuted, fontWeight: '600', width: 64, letterSpacing: 0.3 }}>{lbl}</Text>
      <Text style={{ fontSize: 13, color: C.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const card: object = {
  backgroundColor: C.surface,
  borderRadius: 18,
  padding: 18,
  borderWidth: 1,
  borderColor: C.border,
};

const fieldLabel = {
  fontSize: 11, fontWeight: '700' as const, color: C.textMuted,
  textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8,
};

const fieldInput = {
  backgroundColor: C.surfaceAlt,
  borderWidth: 1.5, borderColor: C.borderAlt, borderRadius: 12,
  paddingHorizontal: 14, paddingVertical: 14,
  fontSize: 16, color: C.textPrimary, fontWeight: '500' as const,
};

const stepperBtn: object = {
  width: 52, height: 52, borderRadius: 14,
  backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

const stepperTxt = {
  fontSize: 24, fontWeight: '500' as const, color: C.textSecondary,
};

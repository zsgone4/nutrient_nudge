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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react-native';

import { useUserStore } from '@/lib/state/user-store';
import { log } from '@/lib/logger';

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

const TOTAL_STEPS = 5;

const STEP_HEADINGS = [
  { title: 'Your account\ndetails ✏️', sub: 'Update your name and email address.' },
  { title: 'About you', sub: 'Keep your details accurate for the best recommendations.' },
  { title: "What are you\ntraining for? 🎯", sub: "Update your main focus." },
  { title: 'Your health goals', sub: "Select all that apply." },
  { title: 'Review changes 👀', sub: 'Everything look right? Hit save to confirm.' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const userId = useUserStore(s => s.userId);
  const storedEmail = useUserStore(s => s.userEmail);
  const storedName = useUserStore(s => s.userName);
  const storedAge = useUserStore(s => s.userAge);
  const storedGender = useUserStore(s => s.userGender);
  const storedTrainingGoal = useUserStore(s => s.userTrainingGoal);
  const storedGoals = useUserStore(s => s.userGoals);
  const updateSignupProfile = useUserStore(s => s.updateSignupProfile);
  const clearUser = useUserStore(s => s.clearUser);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(storedName ?? '');
  const [email, setEmail] = useState(storedEmail ?? '');
  const [age, setAge] = useState(storedAge ?? '25');
  const [gender, setGender] = useState(storedGender ?? '');
  const [trainingGoal, setTrainingGoal] = useState(storedTrainingGoal ?? '');
  const [goals, setGoals] = useState<string[]>(storedGoals?.length ? storedGoals : []);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0: return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      case 1: return age.trim().length > 0 && Number(age) >= 1 && Number(age) <= 120 && gender !== '';
      case 2: return trainingGoal !== '';
      case 3: return goals.length > 0;
      case 4: return true;
      default: return false;
    }
  }, [step, name, email, age, gender, trainingGoal, goals]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BACKEND_URL}/api/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          age: Number(age),
          gender,
          trainingGoal,
          goals,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Something went wrong');
      return json as { success: boolean; user: { id: string; email: string; name: string } };
    },
    onSuccess: () => {
      updateSignupProfile({
        userName: name.trim(),
        userEmail: email.trim().toLowerCase(),
        userAge: age,
        userGender: gender,
        userTrainingGoal: trainingGoal,
        userGoals: goals,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 300);
    },
    onError: (err: Error) => {
      log.error("profile.update.failed", { err, userId });
      setErrorMsg(err.message);
    },
  });

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/account/${userId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to delete account');
      }
      log.info("account.deleted", { userId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearUser();
      router.replace('/account-deleted');
    } catch (e: unknown) {
      log.error("account.delete.failed", { err: e, userId });
      setDeleteError(e instanceof Error ? e.message : 'Something went wrong');
      setIsDeleting(false);
    }
  };

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
    if (step === 0) {
      router.back();
    } else {
      setStep(s => s - 1);
      setErrorMsg('');
    }
  };

  const toggleGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const heading = STEP_HEADINGS[step];

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
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: C.surface,
                borderWidth: 1, borderColor: C.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {step === 0 ? <X size={18} color={C.textSecondary} /> : <ChevronLeft size={20} color={C.textSecondary} />}
            </Pressable>
            <Text style={{ flex: 1, textAlign: 'center', color: C.textMuted, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 }}>
              ACCOUNT SETTINGS
            </Text>
            <View style={{ width: 40 }} />
          </View>

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

            {/* Step 0: Name & Email */}
            {step === 0 && (
              <View style={{ gap: 14 }}>
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

                {/* Danger Zone */}
                <View style={{
                  borderRadius: 18, borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.25)',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  padding: 18,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                    Danger Zone
                  </Text>
                  <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 19, marginBottom: 14 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Text>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowDeleteModal(true); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, paddingVertical: 13, borderRadius: 12,
                      borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.4)',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                    }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15 }}>Delete Account</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Step 1: Age & Gender */}
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

            {/* Step 2: Training Goal */}
            {step === 2 && (
              <View style={{ gap: 10 }}>
                {TRAINING_GOALS.map((tg) => {
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

            {/* Step 3: Health Goals */}
            {step === 3 && (
              <View style={{ gap: 10 }}>
                {GOALS.map((goal) => {
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

            {/* Step 4: Review */}
            {step === 4 && (
              <View style={{ gap: 14 }}>
                <View style={card}>
                  <Text style={[fieldLabel, { marginBottom: 16 }]}>Your updated details</Text>
                  <SummaryRow label="Name" value={name} />
                  <DividerLine />
                  <SummaryRow label="Email" value={email} />
                  <DividerLine />
                  <SummaryRow label="Age" value={`${age} years old`} />
                  <DividerLine />
                  <SummaryRow label="Gender" value={GENDERS.find(g => g.id === gender)?.label ?? gender} />
                  <DividerLine />
                  <SummaryRow
                    label="Training"
                    value={(() => { const t = TRAINING_GOALS.find(t => t.id === trainingGoal); return t ? `${t.emoji} ${t.label}` : trainingGoal; })()}
                  />
                  <DividerLine />
                  <SummaryRow
                    label="Goals"
                    value={goals.map(id => GOALS.find(g => g.id === id)?.label ?? id).join(', ')}
                  />
                </View>
              </View>
            )}

          </View>
        </ScrollView>

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

        <View style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 12,
          paddingTop: 12,
          backgroundColor: C.bg,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}>
          <Pressable
            onPress={handleNext}
            disabled={!isStepValid || mutation.isPending}
            style={({ pressed }) => ({ borderRadius: 16, overflow: 'hidden', opacity: pressed ? 0.85 : 1 })}
          >
            <LinearGradient
              colors={isStepValid ? [C.greenDark, C.green] : [C.surface, C.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
                    {step < TOTAL_STEPS - 1 ? 'Continue' : 'Save Changes'}
                  </Text>
                  {step < TOTAL_STEPS - 1 && isStepValid && <ChevronRight size={18} color="white" />}
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Delete Account Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)' }}>
          <View style={{
            backgroundColor: C.surface, borderRadius: 24, padding: 24,
            marginHorizontal: 24, width: '100%', maxWidth: 360,
            borderWidth: 1, borderColor: C.border,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30,
                backgroundColor: 'rgba(239,68,68,0.15)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: C.textPrimary, textAlign: 'center', marginBottom: 8 }}>
                Delete Account?
              </Text>
              <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21 }}>
                This will permanently delete your account and all your data. This action cannot be undone.
              </Text>
            </View>

            {deleteError && (
              <View style={{
                backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 12,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
                padding: 12, marginBottom: 16,
              }}>
                <Text style={{ color: '#F87171', fontSize: 13, textAlign: 'center' }}>{deleteError}</Text>
              </View>
            )}

            <Pressable
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              style={{
                backgroundColor: '#EF4444', borderRadius: 14,
                paddingVertical: 16, alignItems: 'center', marginBottom: 10,
              }}
            >
              {isDeleting
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Yes, Delete My Account</Text>
              }
            </Pressable>

            <Pressable
              onPress={() => { setShowDeleteModal(false); setDeleteError(null); }}
              disabled={isDeleting}
              style={{
                backgroundColor: C.surfaceAlt, borderRadius: 14,
                paddingVertical: 16, alignItems: 'center',
                borderWidth: 1, borderColor: C.border,
              }}
            >
              <Text style={{ color: C.textSecondary, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  backgroundColor: C.surface, borderRadius: 18, padding: 18,
  borderWidth: 1, borderColor: C.border,
};

const fieldLabel = {
  fontSize: 11, fontWeight: '700' as const, color: C.textMuted,
  textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8,
};

const fieldInput = {
  backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.borderAlt,
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
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

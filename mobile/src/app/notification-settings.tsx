import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Bell, BellOff, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

import {
  ReminderConfig,
  NotificationSettings,
  DEFAULT_REMINDERS,
  loadNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
} from '@/lib/utils/notificationSettings';

// Show notification banners even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const C = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceAlt: '#222222',
  border: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#555555',
  green: '#10B981',
  greenDark: '#059669',
};

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [reminders, setReminders] = useState<ReminderConfig[]>(DEFAULT_REMINDERS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    loadNotificationSettings().then(s => {
      setMasterEnabled(s.enabled);
      setReminders(s.reminders);
    });
  }, []);

  const persist = async (enabled: boolean, rems: ReminderConfig[]) => {
    // saveNotificationSettings already (re)schedules with the OS
    await saveNotificationSettings({ enabled, reminders: rems });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const toggleMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        // Don't show reminders as "on" if the user denied permission
        setMasterEnabled(false);
        return;
      }
    }
    setMasterEnabled(val);
    persist(val, reminders);
  };

  const toggleReminder = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = reminders.map(r => r.key === key ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
    persist(masterEnabled, updated);
  };

  const openTimePicker = (key: string) => {
    const r = reminders.find(r => r.key === key);
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
      const updated = reminders.map(r =>
        r.key === pickerKey ? { ...r, hour: date.getHours(), minute: date.getMinutes() } : r
      );
      setReminders(updated);
      persist(masterEnabled, updated);
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

  const confirmIOSTime = () => {
    setPickerOpen(false);
    persist(masterEnabled, reminders);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={['rgba(16,185,129,0.12)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} color={C.textSecondary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', color: C.textMuted, fontSize: 13, fontWeight: '600', letterSpacing: 0.4 }}>
            REMINDERS
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: C.textPrimary, lineHeight: 40 }}>
            Daily Reminders
          </Text>
          <Text style={{ fontSize: 15, color: C.textSecondary, marginTop: 6, lineHeight: 22 }}>
            Get nudged to log your meals and check your nutrient score throughout the day.
          </Text>
        </View>

        {/* Master Toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: C.surface, borderRadius: 18, padding: 18,
          borderWidth: 1,
          borderColor: masterEnabled ? 'rgba(16,185,129,0.35)' : C.border,
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 42, height: 42, borderRadius: 13,
              backgroundColor: masterEnabled ? 'rgba(16,185,129,0.2)' : C.surfaceAlt,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {masterEnabled
                ? <Bell size={19} color={C.green} />
                : <BellOff size={19} color={C.textMuted} />
              }
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>
                Enable Reminders
              </Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                {masterEnabled ? 'Reminders are active' : 'All reminders paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={toggleMaster}
            trackColor={{ false: '#333', true: C.green }}
            thumbColor="white"
          />
        </View>

        {/* Section label */}
        <Text style={{
          fontSize: 11, fontWeight: '700', color: C.textMuted,
          letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
        }}>
          Reminder Times
        </Text>

        {/* Individual Reminders */}
        {reminders.map(r => {
          const isActive = masterEnabled && r.enabled;
          return (
            <View
              key={r.key}
              style={{
                backgroundColor: C.surface, borderRadius: 18,
                borderWidth: 1, borderColor: isActive ? 'rgba(16,185,129,0.22)' : C.border,
                marginBottom: 10, overflow: 'hidden',
                opacity: masterEnabled ? 1 : 0.45,
              }}
            >
              {/* Top row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 14 }}>
                <Text style={{ fontSize: 26, marginRight: 12 }}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: C.textPrimary }}>{r.label}</Text>
                  <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{r.description}</Text>
                </View>
                <Switch
                  value={r.enabled}
                  onValueChange={() => toggleReminder(r.key)}
                  trackColor={{ false: '#333', true: C.green }}
                  thumbColor="white"
                  disabled={!masterEnabled}
                />
              </View>

              {/* Time row */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{
                    fontSize: 18, fontWeight: '800',
                    color: isActive ? C.green : C.textMuted,
                  }}>
                    {formatTime(r.hour, r.minute)}
                  </Text>
                  {isActive && (
                    <Text style={{ fontSize: 11, color: 'rgba(16,185,129,0.7)', fontWeight: '600' }}>
                      Edit
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}

        {/* Info note */}
        <View style={{
          marginTop: 16, backgroundColor: 'rgba(16,185,129,0.08)',
          borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
        }}>
          <Text style={{ fontSize: 13, color: C.textSecondary, lineHeight: 20 }}>
            Reminders are delivered by your phone at the times you set — even when the app is closed. Consistent logging leads to better nutrient insights and a higher score.
          </Text>
        </View>

        {/* Saved flash */}
        {savedFlash && (
          <View style={{
            marginTop: 14, backgroundColor: 'rgba(16,185,129,0.15)',
            borderRadius: 12, padding: 12, alignItems: 'center',
            borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
          }}>
            <Text style={{ color: C.green, fontWeight: '700', fontSize: 14 }}>Settings saved ✓</Text>
          </View>
        )}
      </ScrollView>

      {/* iOS time picker sheet */}
      {Platform.OS === 'ios' && (
        <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <View style={{
              backgroundColor: '#1A1A1A',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 20, paddingBottom: insets.bottom + 24,
              borderTopWidth: 1, borderColor: '#2A2A2A',
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

      {/* Android time picker */}
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

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadNotificationSettings } from '@/lib/utils/notificationSettings';

const REMINDER_MESSAGES: Record<string, string[]> = {
  morning: [
    "Log your first meal — kickstart your nutrient score ✨",
    "Start the day strong — log breakfast to fuel your goals 🌅",
    "Morning check-in! Track breakfast for the best nutrient insights ☀️",
  ],
  afternoon: [
    "Lunchtime! Keep your nutrient score on track 💪",
    "Log your lunch now for better daily insights 🥗",
    "Halfway through the day — log your meals and stay on target 🎯",
  ],
  evening: [
    "Evening check-in — log dinner & see your nutrient score 🌙",
    "Score ready — check it, share it, beat your friends 🏆",
    "Don't forget to log dinner and review your daily score 🌟",
  ],
};

function getTodayKey(key: string) {
  const today = new Date().toISOString().split('T')[0];
  return `reminder_dismissed_${key}_${today}`;
}

function pickMessage(key: string): string {
  const msgs = REMINDER_MESSAGES[key] ?? [`Time to log your ${key} meal!`];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function useNotifications() {
  const [reminder, setReminder] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    checkReminder();
  }, []);

  async function checkReminder() {
    const settings = await loadNotificationSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const r of settings.reminders) {
      if (!r.enabled) continue;

      const startMinutes = r.hour * 60 + r.minute;
      const withinWindow = currentMinutes >= startMinutes && currentMinutes < startMinutes + 180;
      if (!withinWindow) continue;

      const dismissed = await AsyncStorage.getItem(getTodayKey(r.key));
      if (dismissed) continue;

      setReminder(pickMessage(r.key));
      setActiveKey(r.key);
      return;
    }
  }

  async function dismissReminder() {
    if (activeKey) {
      await AsyncStorage.setItem(getTodayKey(activeKey), 'true');
    }
    setReminder(null);
    setActiveKey(null);
  }

  return { reminder, dismissReminder };
}

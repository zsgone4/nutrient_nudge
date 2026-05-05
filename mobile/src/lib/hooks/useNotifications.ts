import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-app daily reminders (shown when app is opened near reminder times)
const REMINDERS = [
  { hour: 8,  range: 3,  key: 'morning', body: 'Log your first meal—kickstart your nutrient score 🌟' },
  { hour: 12, range: 2,  key: 'lunch',   body: 'Log now, boost your nutrients 💪' },
  { hour: 20, range: 3,  key: 'evening', body: 'Score ready—check it, share it, beat your friends 🏆' },
];

function getTodayKey(key: string) {
  const today = new Date().toISOString().split('T')[0];
  return `reminder_dismissed_${key}_${today}`;
}

export function useNotifications() {
  const [reminder, setReminder] = useState<string | null>(null);

  useEffect(() => {
    checkReminder();
  }, []);

  async function checkReminder() {
    const now = new Date();
    const hour = now.getHours();

    for (const r of REMINDERS) {
      const withinRange = hour >= r.hour && hour < r.hour + r.range;
      if (!withinRange) continue;

      const dismissedKey = getTodayKey(r.key);
      const dismissed = await AsyncStorage.getItem(dismissedKey);
      if (dismissed) continue;

      setReminder(r.body);
      return;
    }
  }

  async function dismissReminder() {
    const now = new Date();
    const hour = now.getHours();
    for (const r of REMINDERS) {
      if (hour >= r.hour && hour < r.hour + r.range) {
        await AsyncStorage.setItem(getTodayKey(r.key), 'true');
        break;
      }
    }
    setReminder(null);
  }

  return { reminder, dismissReminder };
}

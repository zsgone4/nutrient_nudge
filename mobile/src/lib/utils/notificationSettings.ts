import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_SETTINGS_KEY = 'notification_settings_v2';

export type ReminderConfig = {
  key: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label: string;
  emoji: string;
  description: string;
};

export type NotificationSettings = {
  enabled: boolean;
  reminders: ReminderConfig[];
};

export const DEFAULT_REMINDERS: ReminderConfig[] = [
  { key: 'morning',   hour: 8,  minute: 0, enabled: true, label: 'Morning',   emoji: '☀️', description: 'Log your breakfast' },
  { key: 'afternoon', hour: 12, minute: 0, enabled: true, label: 'Afternoon', emoji: '🌤', description: 'Track your lunch' },
  { key: 'evening',   hour: 20, minute: 0, enabled: true, label: 'Evening',   emoji: '🌙', description: 'Log dinner & check your score' },
];

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  reminders: DEFAULT_REMINDERS,
};

const REMINDER_MESSAGES: Record<string, string[]> = {
  morning: [
    "Log your breakfast — kickstart your nutrient score ✨",
    "Start the day strong — track breakfast to fuel your goals 🌅",
    "Morning check-in! Log breakfast for the best nutrient insights ☀️",
  ],
  afternoon: [
    "Lunchtime! Keep your nutrient score on track 💪",
    "Log your lunch now for better daily insights 🥗",
    "Halfway through the day — log your meals and stay on target 🎯",
  ],
  evening: [
    "Log dinner & check your nutrient score 🌙",
    "Evening check-in — how did you do today? 🏆",
    "Don't forget to log dinner and review your daily score 🌟",
  ],
};

function pickMessage(key: string): string {
  const msgs = REMINDER_MESSAGES[key] ?? [`Time to log your ${key} meal!`];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ---- Engagement nudges (habit-building, beyond meal logging) ----
// frequency 'daily'  -> fires once a day at hour:minute (weekdays ignored)
// frequency 'weekly' -> fires on each listed weekday at hour:minute
// Weekday numbering: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
// To add a new nudge, just append an object to this array.
export type EngagementConfig = {
  key: string;
  frequency: 'daily' | 'weekly';
  weekdays?: number[]; // required when frequency === 'weekly'
  hour: number;
  minute: number;
  enabled: boolean;
  title: string;
  body: string;
};

export const ENGAGEMENT_NOTIFICATIONS: EngagementConfig[] = [
  {
    key: 'score-share',
    frequency: 'weekly',
    weekdays: [2, 4, 6], // Mon, Wed, Fri
    hour: 18,
    minute: 30,
    enabled: true,
    title: "📊 How's your nutrient score?",
    body: "Check today's score and share your progress with a friend!",
  },
  {
    key: 'feel-difference',
    frequency: 'daily',
    hour: 19,
    minute: 30,
    enabled: true,
    title: "✨ Feel the Difference",
    body: "See how today's food is powering your sleep, skin, recovery & energy.",
  },
  {
    key: 'weekly-recap',
    frequency: 'weekly',
    weekdays: [1], // Sunday
    hour: 19,
    minute: 0,
    enabled: true,
    title: "📈 Your 7-day nutrient score",
    body: "Check this week's consistency and set yourself up for next week!",
  },
];

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAllNotifications(settings: NotificationSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel everything first, then rebuild the full schedule
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // 1) Daily meal reminders
  for (const reminder of settings.reminders) {
    if (!reminder.enabled) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${reminder.emoji} ${reminder.label} Reminder`,
        body: pickMessage(reminder.key),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  }

  // 2) Engagement nudges (daily or weekly)
  for (const item of ENGAGEMENT_NOTIFICATIONS) {
    if (!item.enabled) continue;

    if (item.frequency === 'daily') {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: item.hour,
          minute: item.minute,
        },
      });
    } else {
      for (const weekday of item.weekdays ?? []) {
        await Notifications.scheduleNotificationAsync({
          content: { title: item.title, body: item.body, sound: true },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: item.hour,
            minute: item.minute,
          },
        });
      }
    }
  }
}

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return {
      enabled: parsed.enabled ?? true,
      reminders: DEFAULT_REMINDERS.map(def => {
        const saved = parsed.reminders?.find(r => r.key === def.key);
        return saved ? { ...def, ...saved } : def;
      }),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  await scheduleAllNotifications(settings);
}

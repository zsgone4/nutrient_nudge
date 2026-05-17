import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

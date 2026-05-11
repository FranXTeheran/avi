import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  ReminderTimePreset,
} from "../types/notifications";

const STORAGE_KEY = "avi_notification_preferences";

function sanitizeHour(value: unknown, fallback: number) {
  if (typeof value !== "number") return fallback;

  if (Number.isNaN(value)) return fallback;

  if (value < 0 || value > 23) return fallback;

  return Math.floor(value);
}

function sanitizeMinute(value: unknown, fallback: number) {
  if (typeof value !== "number") return fallback;

  if (Number.isNaN(value)) return fallback;

  if (value < 0 || value > 59) return fallback;

  return Math.floor(value);
}

function sanitizePreset(
  value: unknown
): ReminderTimePreset {
  if (
    value === "late_morning" ||
    value === "early_morning" ||
    value === "afternoon" ||
    value === "calm_night" ||
    value === "custom"
  ) {
    return value;
  }

  return DEFAULT_NOTIFICATION_PREFERENCES.reminderTimePreset;
}

function sanitizePreferences(
  value: Partial<NotificationPreferences>
): NotificationPreferences {
  return {
    enabled:
      typeof value.enabled === "boolean"
        ? value.enabled
        : DEFAULT_NOTIFICATION_PREFERENCES.enabled,

    sound:
      value.sound === "avi_soft.wav" ||
      value.sound === "default" ||
      value.sound === "silent"
        ? value.sound
        : DEFAULT_NOTIFICATION_PREFERENCES.sound,

    vibration:
      value.vibration === "soft" ||
      value.vibration === "off"
        ? value.vibration
        : DEFAULT_NOTIFICATION_PREFERENCES.vibration,

    reminderTimePreset:
      sanitizePreset(value.reminderTimePreset),

    preferredMainHour:
      sanitizeHour(
        value.preferredMainHour,
        DEFAULT_NOTIFICATION_PREFERENCES.preferredMainHour
      ),

    preferredMainMinute:
      sanitizeMinute(
        value.preferredMainMinute,
        DEFAULT_NOTIFICATION_PREFERENCES.preferredMainMinute
      ),

    preferredSoftHour:
      sanitizeHour(
        value.preferredSoftHour,
        DEFAULT_NOTIFICATION_PREFERENCES.preferredSoftHour
      ),

    preferredSoftMinute:
      sanitizeMinute(
        value.preferredSoftMinute,
        DEFAULT_NOTIFICATION_PREFERENCES.preferredSoftMinute
      ),

    weeklySummaryEnabled:
      typeof value.weeklySummaryEnabled === "boolean"
        ? value.weeklySummaryEnabled
        : DEFAULT_NOTIFICATION_PREFERENCES.weeklySummaryEnabled,
  };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    const parsed = JSON.parse(stored);

    return sanitizePreferences(parsed);
  } catch (error) {
    console.log("Error cargando preferencias:", error);

    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
): Promise<NotificationPreferences> {
  try {
    const sanitized = sanitizePreferences(preferences);

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sanitized)
    );

    return sanitized;
  } catch (error) {
    console.log("Error guardando preferencias:", error);

    throw error;
  }
}

export async function resetNotificationPreferences() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);

    return DEFAULT_NOTIFICATION_PREFERENCES;
  } catch (error) {
    console.log("Error reseteando preferencias:", error);

    throw error;
  }
}
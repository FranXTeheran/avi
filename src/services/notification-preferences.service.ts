import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
} from "../types/notifications";

const STORAGE_KEY = "avi_notification_preferences";

function sanitizePreferences(
  value: Partial<NotificationPreferences>
): NotificationPreferences {
  return {
    enabled:
      typeof value.enabled === "boolean"
        ? value.enabled
        : DEFAULT_NOTIFICATION_PREFERENCES.enabled,

    sound:
      value.sound === "avi_soft.mp3" ||
      value.sound === "default" ||
      value.sound === "silent"
        ? value.sound
        : DEFAULT_NOTIFICATION_PREFERENCES.sound,

    vibration:
      value.vibration === "soft" ||
      value.vibration === "off"
        ? value.vibration
        : DEFAULT_NOTIFICATION_PREFERENCES.vibration,
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
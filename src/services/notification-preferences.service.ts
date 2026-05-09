import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
} from "../types/notifications";

const STORAGE_KEY = "avi_notification_preferences";

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...JSON.parse(stored),
  };
}

export async function saveNotificationPreferences(
  preferences: NotificationPreferences
) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(preferences)
  );

  return preferences;
}
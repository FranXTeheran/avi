export type NotificationSound =
  | "avi_soft.mp3"
  | "default"
  | null;

export type VibrationMode = "soft" | "off";

export type NotificationPreferences = {
  enabled: boolean;
  sound: NotificationSound;
  vibration: VibrationMode;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: "avi_soft.mp3",
  vibration: "soft",
};
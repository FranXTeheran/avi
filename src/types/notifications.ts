export type NotificationSound =
  | "avi_soft.wav"
  | "default"
  | "silent";

export type VibrationMode =
  | "soft"
  | "off";

export type ReminderTimePreset =
  | "late_morning"
  | "early_morning"
  | "afternoon"
  | "calm_night"
  | "custom";

export type NotificationPreferences = {
  enabled: boolean;

  sound: NotificationSound;

  vibration: VibrationMode;

  reminderTimePreset: ReminderTimePreset;

  preferredMainHour: number;

  preferredMainMinute: number;

  preferredSoftHour: number;

  preferredSoftMinute: number;

  weeklySummaryEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,

  sound: "avi_soft.wav",

  vibration: "soft",

  reminderTimePreset: "late_morning",

  preferredMainHour: 11,

  preferredMainMinute: 0,

  preferredSoftHour: 19,

  preferredSoftMinute: 0,

  weeklySummaryEnabled: true,
};
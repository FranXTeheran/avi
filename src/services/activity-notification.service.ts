import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { supabase } from "@/src/lib/supabase";
import { getNotificationPreferences } from "./notification-preferences.service";
import { NotificationPreferences } from "../types/notifications";

export type ReminderType =
  | "seven_days_before"
  | "three_days_before"
  | "two_days_before"
  | "one_day_before"
  | "same_day"
  | "same_day_evening";

type ActivityForNotification = {
  id: string;
  user_id: string;
  title: string;
  due_at: string | null;
  type?: string | null;
  subject_name?: string | null;
  status?: string | null;
};

type ReminderConfig = {
  type: ReminderType;
  daysBefore: number;
};

const CHANNEL_ID = "avi-reminders-v2";
const WEEKLY_CALM_ID = "weekly-calm";
const DAY_MS = 1000 * 60 * 60 * 24;
const BATCH_SIZE = 5;
const MAX_NOTIFICATIONS_PER_DAY = 3;

const QUIET_HOURS = {
  start: 22,
  end: 7,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_CONFIG_BY_TYPE: Record<string, ReminderConfig[]> = {
  final_project: [
    { type: "seven_days_before", daysBefore: 7 },
    { type: "three_days_before", daysBefore: 3 },
    { type: "one_day_before", daysBefore: 1 },
    { type: "same_day", daysBefore: 0 },
    { type: "same_day_evening", daysBefore: 0 },
  ],
  evaluation: [
    { type: "two_days_before", daysBefore: 2 },
    { type: "one_day_before", daysBefore: 1 },
    { type: "same_day", daysBefore: 0 },
    { type: "same_day_evening", daysBefore: 0 },
  ],
  protocol: [
    { type: "one_day_before", daysBefore: 1 },
    { type: "same_day", daysBefore: 0 },
    { type: "same_day_evening", daysBefore: 0 },
  ],
  default: [
    { type: "three_days_before", daysBefore: 3 },
    { type: "one_day_before", daysBefore: 1 },
    { type: "same_day", daysBefore: 0 },
    { type: "same_day_evening", daysBefore: 0 },
  ],
};

function getReminderConfig(type?: string | null): ReminderConfig[] {
  if (!type) return REMINDER_CONFIG_BY_TYPE.default;
  return REMINDER_CONFIG_BY_TYPE[type] ?? REMINDER_CONFIG_BY_TYPE.default;
}

function isQuietHours(date: Date) {
  const hour = date.getHours();
  return hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end;
}

function moveOutOfQuietHours(date: Date) {
  if (!isQuietHours(date)) return date;

  const nextDate = new Date(date);

  if (nextDate.getHours() >= QUIET_HOURS.start) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  nextDate.setHours(8, 0, 0, 0);

  return nextDate;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getScheduledCountForDay(date: Date) {
  const targetKey = getDateKey(date);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter((notification) => {
    const trigger = notification.trigger as any;
    const triggerDate = trigger?.date || trigger?.value || trigger?.timestamp;

    if (!triggerDate) return false;

    const parsedDate = new Date(triggerDate);

    if (Number.isNaN(parsedDate.getTime())) return false;

    return getDateKey(parsedDate) === targetKey;
  }).length;
}

function getDailySummaryId(dateKey: string) {
  return `daily-summary-${dateKey}`;
}

async function hasDailySummaryScheduled(dateKey: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((notification) => {
    return notification.content.data?.summaryId === getDailySummaryId(dateKey);
  });
}

async function scheduleDailySummaryNotification(
  date: Date,
  preferences: NotificationPreferences
) {
  const dateKey = getDateKey(date);
  const summaryId = getDailySummaryId(dateKey);
  const alreadyScheduled = await hasDailySummaryScheduled(dateKey);

  if (alreadyScheduled) return;

  const summaryDate = new Date(date);
  summaryDate.setHours(
    preferences.preferredSoftHour,
    preferences.preferredSoftMinute,
    0,
    0
  );

  const now = new Date();
  if (summaryDate <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "AVI · Tienes varias entregas cerca ✨",
      body: "Hay varias actividades importantes ese día. Vamos una por una, sin saturarte.",
      sound: getContentSound(preferences),
      data: {
        type: "daily_summary",
        summaryId,
        dateKey,
        source: "avi",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: summaryDate,
      channelId: CHANNEL_ID,
    },
  });
}

function getActivityLabel(type?: string | null): string {
  if (type === "evaluation") return "evaluación";
  if (type === "final_project") return "trabajo final";
  if (type === "protocol") return "protocolo";
  return "actividad";
}

function getContentSound(preferences: NotificationPreferences) {
  if (preferences.sound === "silent") return false;
  if (preferences.sound === "default") return "default";
  return "avi_soft.wav";
}

function getNotificationCopy(
  activity: ActivityForNotification,
  reminderType: ReminderType
) {
  const label = getActivityLabel(activity.type);
  const subject = activity.subject_name ? ` · ${activity.subject_name}` : "";
  const title = activity.title;

  if (reminderType === "seven_days_before") {
    return {
      title: `AVI · Tu ${label} vence en una semana ✨`,
      body: `${title}${subject}. Todavía tienes margen. Buen momento para empezar con calma.`,
    };
  }

  if (reminderType === "three_days_before") {
    return {
      title: `AVI · Se acerca tu ${label} ✨`,
      body: `${title}${subject} vence en 3 días. Te aviso con tiempo para que puedas organizarte.`,
    };
  }

  if (reminderType === "two_days_before") {
    return {
      title: `AVI · Tu ${label} vence pasado mañana`,
      body: `${title}${subject}. Todavía tienes margen. Una cosa a la vez.`,
    };
  }

  if (reminderType === "one_day_before") {
    return {
      title: `AVI · Mañana vence tu ${label} ✨`,
      body: `${title}${subject}. Buen momento para dejarlo listo hoy.`,
    };
  }

  if (reminderType === "same_day") {
    return {
      title: `AVI · Hoy vence tu ${label}`,
      body: `${title}${subject}. Puedes revisarlo cuando tengas un momento. Puedes con esto.`,
    };
  }

  return {
    title: "AVI · Solo un recordatorio suave",
    body: `${title}${subject}. Vence hoy. Todavía tienes tiempo. Puedes con esto ✨`,
  };
}

function getScheduledDate(
  dueAt: string,
  daysBefore: number,
  reminderType: ReminderType,
  preferences: NotificationPreferences
): Date | null {
  const date = new Date(dueAt);

  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() - daysBefore);

  if (reminderType === "same_day_evening") {
    date.setHours(
      preferences.preferredSoftHour,
      preferences.preferredSoftMinute,
      0,
      0
    );
  } else {
    date.setHours(
      preferences.preferredMainHour,
      preferences.preferredMainMinute,
      0,
      0
    );
  }

  return moveOutOfQuietHours(date);
}

async function configureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "AVI recordatorios",
    description: "Recordatorios académicos suaves de AVI.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "avi_soft.wav",
    vibrationPattern: [0, 120, 80, 120],
    lightColor: "#FFC21A",
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  await configureAndroidChannel();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function sendTestNotification(): Promise<void> {
  const preferences = await getNotificationPreferences();

  if (!preferences.enabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "AVI · Prueba de recordatorio ✨",
      body: "Así se sentirá AVI cuando te acompañe con tus entregas. Una cosa a la vez.",
      sound: getContentSound(preferences),
      data: { test: true, source: "avi" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CHANNEL_ID,
    },
  });
}

async function cancelWeeklyCalmNotification() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const weeklyNotifications = scheduled.filter((notification) => {
    return notification.content.data?.type === WEEKLY_CALM_ID;
  });

  await Promise.all(
    weeklyNotifications.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

export async function scheduleWeeklyCalmNotification(): Promise<void> {
  const preferences = await getNotificationPreferences();

  if (!preferences.enabled) return;
  if (!preferences.weeklySummaryEnabled) return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await cancelWeeklyCalmNotification();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(
    preferences.preferredSoftHour,
    preferences.preferredSoftMinute,
    0,
    0
  );

  if (nextSunday <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "AVI · Tu semana se ve manejable ✨",
      body: "No tienes entregas urgentes por ahora. Puedes organizarte con calma.",
      sound: getContentSound(preferences),
      data: { type: WEEKLY_CALM_ID, source: "avi" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextSunday,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelActivityNotifications(activityId: string) {
  const { data, error } = await supabase
    .from("activity_notifications")
    .select("id, notification_id")
    .eq("activity_id", activityId);

  if (error) {
    console.warn("Error loading activity notifications:", error.message);
    return;
  }

  const rows = data ?? [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(row.notification_id);
      } catch (error) {
        console.warn("Error cancelling notification:", error);
      }
    })
  );

  const { error: deleteError } = await supabase
    .from("activity_notifications")
    .delete()
    .eq("activity_id", activityId);

  if (deleteError) {
    console.warn("Error deleting activity notifications:", deleteError.message);
  }
}

export async function scheduleActivityNotifications(
  activity: ActivityForNotification
) {
  const preferences = await getNotificationPreferences();

  if (!preferences.enabled) {
    await cancelActivityNotifications(activity.id);
    return;
  }

  if (!activity.due_at) return;

  if (activity.status === "completed") {
    await cancelActivityNotifications(activity.id);
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await cancelActivityNotifications(activity.id);

  const now = new Date();
  const dueDate = new Date(activity.due_at);

  if (Number.isNaN(dueDate.getTime())) return;
  if (dueDate <= now) return;

  const reminders = getReminderConfig(activity.type);

  for (const reminder of reminders) {
    const scheduledFor = getScheduledDate(
      activity.due_at,
      reminder.daysBefore,
      reminder.type,
      preferences
    );

    if (!scheduledFor || scheduledFor <= now) continue;

    const scheduledCount = await getScheduledCountForDay(scheduledFor);

    if (scheduledCount >= MAX_NOTIFICATIONS_PER_DAY) {
      await scheduleDailySummaryNotification(scheduledFor, preferences);
      continue;
    }

    const copy = getNotificationCopy(activity, reminder.type);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        sound: getContentSound(preferences),
        data: {
          activityId: activity.id,
          reminderType: reminder.type,
          source: "avi",
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
        channelId: CHANNEL_ID,
      },
    });

    const { error } = await supabase.from("activity_notifications").insert({
      user_id: activity.user_id,
      activity_id: activity.id,
      notification_id: notificationId,
      reminder_type: reminder.type,
      scheduled_for: scheduledFor.toISOString(),
    });

    if (error) {
      console.warn("Error saving notification:", error.message);
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch {}
    }
  }
}

function hasUrgentActivities(activities: ActivityForNotification[]) {
  const now = new Date();

  return activities.some((activity) => {
    if (!activity.due_at || activity.status === "completed") return false;

    const dueDate = new Date(activity.due_at);
    if (Number.isNaN(dueDate.getTime())) return false;

    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS);
    return diffDays >= 0 && diffDays <= 3;
  });
}

// 👇 FUNCIÓN CORREGIDA — acepta forceReschedule
export async function rescheduleActivityNotifications(
  activities: ActivityForNotification[],
  forceReschedule = false
) {
  const preferences = await getNotificationPreferences();

  if (!preferences.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await supabase.from("activity_notifications").delete().neq("id", "");
    return;
  }

  if (activities.length === 0) {
    await scheduleWeeklyCalmNotification();
    return;
  }

  // Si forceReschedule, cancela todo y reprograma desde cero
  if (forceReschedule) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await supabase.from("activity_notifications").delete().neq("id", "");
  }

  const activityIds = activities.map((a) => a.id);

  let existingActivityIds = new Set<string>();

  if (!forceReschedule) {
    const { data: existingNotifications } = await supabase
      .from("activity_notifications")
      .select("activity_id")
      .in("activity_id", activityIds);

    existingActivityIds = new Set(
      (existingNotifications ?? []).map((row) => row.activity_id)
    );
  }

  const toReschedule = activities.filter((activity) => {
    if (!activity.due_at) return false;
    if (activity.status === "completed") return false;

    const dueDate = new Date(activity.due_at);
    if (Number.isNaN(dueDate.getTime())) return false;
    if (dueDate <= new Date()) return false;

    return forceReschedule || !existingActivityIds.has(activity.id);
  });

  for (let i = 0; i < toReschedule.length; i += BATCH_SIZE) {
    const batch = toReschedule.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((activity) => scheduleActivityNotifications(activity))
    );
  }

  if (hasUrgentActivities(activities)) {
    await cancelWeeklyCalmNotification();
  } else {
    scheduleWeeklyCalmNotification().catch((error) => {
      console.warn("Error scheduling weekly calm:", error);
    });
  }
}

export async function cancelCompletedActivityNotifications(activityId: string) {
  await cancelActivityNotifications(activityId);
}
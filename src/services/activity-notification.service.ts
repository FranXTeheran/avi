import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "@/src/lib/supabase";

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

function getActivityLabel(type?: string | null): string {
  switch (type) {
    case "evaluation": return "evaluación";
    case "final_project": return "trabajo final";
    case "protocol": return "protocolo";
    default: return "actividad";
  }
}

function getNotificationCopy(
  activity: ActivityForNotification,
  reminderType: ReminderType
) {
  const label = getActivityLabel(activity.type);
  const subject = activity.subject_name ? ` · ${activity.subject_name}` : "";
  const title = activity.title;

  switch (reminderType) {
    case "seven_days_before":
      return {
        title: `AVI · Tu ${label} vence en una semana ✨`,
        body: `${title}${subject}. Todavía tienes margen. Buen momento para empezar con calma.`,
      };
    case "three_days_before":
      return {
        title: `AVI · Se acerca tu ${label} ✨`,
        body: `${title}${subject} vence en 3 días. Te aviso con tiempo para que puedas organizarte.`,
      };
    case "two_days_before":
      return {
        title: `AVI · Tu ${label} vence pasado mañana`,
        body: `${title}${subject}. Todavía tienes margen. Una cosa a la vez.`,
      };
    case "one_day_before":
      return {
        title: `AVI · Mañana vence tu ${label} ✨`,
        body: `${title}${subject}. Vence mañana. Buen momento para dejarlo listo hoy.`,
      };
    case "same_day":
      return {
        title: `AVI · Hoy vence tu ${label}`,
        body: `${title}${subject}. Puedes revisarlo cuando tengas un momento. Puedes con esto.`,
      };
    case "same_day_evening":
      return {
        title: `AVI · Solo un recordatorio suave`,
        body: `${title}${subject}. Vence hoy. Todavía tienes tiempo. Puedes con esto ✨`,
      };
  }
}

function getScheduledDate(dueAt: string, daysBefore: number, reminderType: ReminderType): Date {
  const date = new Date(dueAt);
  date.setDate(date.getDate() - daysBefore);

  if (reminderType === "same_day_evening") {
    date.setHours(18, 0, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }

  return date;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.deleteNotificationChannelAsync("avi-default");
    await Notifications.setNotificationChannelAsync("avi-default", {
      name: "AVI recordatorios",
      description: "Recordatorios académicos suaves de AVI.",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "avi_soft.mp3",
      lightColor: "#FFC21A",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function sendTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const tests = [
    { type: "evaluation", label: "evaluación", seconds: 3 },
    { type: "final_project", label: "trabajo final", seconds: 8 },
    { type: "protocol", label: "protocolo", seconds: 13 },
    { type: "default", label: "actividad", seconds: 18 },
    { type: "same_day_evening", label: "recordatorio tarde", seconds: 23 },
  ];

  for (const item of tests) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `AVI · Prueba · ${item.label} ✨`,
        body: `Así se verá tu recordatorio de ${item.label}. Una cosa a la vez.`,
        sound: true,
        data: { test: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: item.seconds,
      },
    });
  }
}

export async function scheduleWeeklyCalmNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancela la calma semanal anterior si existe
  const { data } = await supabase
    .from("activity_notifications")
    .select("notification_id")
    .eq("activity_id", "weekly-calm")
    .eq("reminder_type", "weekly_calm");

  for (const row of data ?? []) {
    try {
      await Notifications.cancelScheduledNotificationAsync(row.notification_id);
    } catch {}
  }

  await supabase
    .from("activity_notifications")
    .delete()
    .eq("activity_id", "weekly-calm");

  // Próximo domingo o lunes a las 8pm
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes...
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(20, 0, 0, 0);

  if (nextSunday <= now) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "AVI · Tu semana se ve manejable ✨",
      body: "No tienes entregas urgentes por ahora. Puedes organizarte con calma.",
      sound: true,
      data: { type: "weekly_calm" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextSunday,
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
  if (!activity.due_at) return;

  if (activity.status === "completed") {
    await cancelActivityNotifications(activity.id);
    return;
  }

  await cancelActivityNotifications(activity.id);

  const now = new Date();
  const dueDate = new Date(activity.due_at);

  if (Number.isNaN(dueDate.getTime())) return;
  if (dueDate <= now) return;

  const reminders = getReminderConfig(activity.type);

  for (const reminder of reminders) {
    const scheduledFor = getScheduledDate(activity.due_at, reminder.daysBefore, reminder.type);

    if (scheduledFor <= now) continue;

    const copy = getNotificationCopy(activity, reminder.type);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        sound: true,
        data: {
          activityId: activity.id,
          reminderType: reminder.type,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledFor,
      },
    });

    const { error } = await supabase
      .from("activity_notifications")
      .insert({
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

export async function rescheduleActivityNotifications(
  activities: ActivityForNotification[]
) {
  const BATCH_SIZE = 5;

  const activityIds = activities.map((a) => a.id);

  const { data: existingNotifications } = await supabase
    .from("activity_notifications")
    .select("activity_id, scheduled_for")
    .in("activity_id", activityIds);

  const existingMap = new Map<string, string>();
  for (const row of existingNotifications ?? []) {
    const current = existingMap.get(row.activity_id);
    if (!current || new Date(row.scheduled_for) < new Date(current)) {
      existingMap.set(row.activity_id, row.scheduled_for);
    }
  }

  const toReschedule = activities.filter((activity) => {
    if (!activity.due_at) return false;
    if (activity.status === "completed") return false;

    const hasExisting = existingMap.has(activity.id);
    if (!hasExisting) return true;

    const existingScheduled = new Date(existingMap.get(activity.id)!);
    const dueDate = new Date(activity.due_at);
    const diffMs = Math.abs(dueDate.getTime() - existingScheduled.getTime());

    return diffMs > 1000 * 60 * 60 * 24;
  });

  for (let i = 0; i < toReschedule.length; i += BATCH_SIZE) {
    const batch = toReschedule.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((a) => scheduleActivityNotifications(a)));
  }

  // Programar notificación de calma semanal si no hay urgencias
  const hasUrgentActivities = activities.some((activity) => {
    if (!activity.due_at || activity.status === "completed") return false;
    const dueDate = new Date(activity.due_at);
    const now = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 3;
  });

  if (!hasUrgentActivities) {
    scheduleWeeklyCalmNotification().catch((error) => {
      console.warn("Error scheduling weekly calm:", error);
    });
  }
}

export async function cancelCompletedActivityNotifications(
  activityId: string
) {
  await cancelActivityNotifications(activityId);
}
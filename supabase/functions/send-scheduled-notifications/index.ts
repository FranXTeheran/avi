// @ts-ignore
/// <reference types="https://deno.land/x/types/index.d.ts" />
// deno-lint-ignore no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown>
) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data,
      sound: "default",
      priority: "high",
    }),
  });

  return response.json();
}

Deno.serve(async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 1000);

    const { data: notifications, error } = await supabase
      .from("activity_notifications")
      .select(`
        id,
        user_id,
        activity_id,
        reminder_type,
        scheduled_for,
        activities (
          title,
          type,
          subject_name
        )
      `)
      .eq("sent", false)
      .lte("scheduled_for", windowEnd.toISOString())
      .gte("scheduled_for", new Date(now.getTime() - 60 * 1000).toISOString());

    if (error) throw error;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

  const userIds = [...new Set(notifications.map((n: { user_id: string }) => n.user_id))];

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", userIds);

      const tokenMap = new Map<string, string>(
        tokens?.map((t: { user_id: string; token: string }) => [t.user_id, t.token]) ?? []
      );
    let sent = 0;

    for (const notification of notifications) {
      const token = tokenMap.get(notification.user_id);
      if (!token || typeof token !== "string") continue;

      const activity = notification.activities as any;
      const { title, body } = getNotificationCopy(
        activity?.title ?? "Actividad",
        activity?.type,
        activity?.subject_name,
        notification.reminder_type
      );

      await sendExpoPushNotification(token, title, body, {
        activityId: notification.activity_id,
        reminderType: notification.reminder_type,
        source: "avi",
      });

      await supabase
        .from("activity_notifications")
        .update({ sent: true, sent_at: now.toISOString() })
        .eq("id", notification.id);

      sent++;
    }

    return new Response(JSON.stringify({ sent }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

function getActivityLabel(type?: string | null): string {
  if (type === "evaluation") return "evaluación";
  if (type === "final_project") return "trabajo final";
  if (type === "protocol") return "protocolo";
  return "actividad";
}

function getNotificationCopy(
  title: string,
  type: string | null,
  subjectName: string | null,
  reminderType: string
): { title: string; body: string } {
  const label = getActivityLabel(type);
  const subject = subjectName ? ` · ${subjectName}` : "";

  if (reminderType === "seven_days_before") {
    return {
      title: `Kai · Tu ${label} vence en una semana ✨`,
      body: `${title}${subject}. Todavía tienes margen. Buen momento para empezar con calma.`,
    };
  }
  if (reminderType === "three_days_before") {
    return {
      title: `Kai · Se acerca tu ${label} ✨`,
      body: `${title}${subject} vence en 3 días. Te aviso con tiempo para que puedas organizarte.`,
    };
  }
  if (reminderType === "two_days_before") {
    return {
      title: `Kai · Tu ${label} vence pasado mañana`,
      body: `${title}${subject}. Todavía tienes margen. Una cosa a la vez.`,
    };
  }
  if (reminderType === "one_day_before") {
    return {
      title: `Kai · Mañana vence tu ${label} ✨`,
      body: `${title}${subject}. Buen momento para dejarlo listo hoy.`,
    };
  }
  if (reminderType === "same_day") {
    return {
      title: `Kai · Hoy vence tu ${label}`,
      body: `${title}${subject}. Puedes revisarlo cuando tengas un momento. Puedes con esto.`,
    };
  }
  return {
    title: "Kai · Solo un recordatorio suave",
    body: `${title}${subject}. Vence hoy. Todavía tienes tiempo. Puedes con esto ✨`,
  };
}
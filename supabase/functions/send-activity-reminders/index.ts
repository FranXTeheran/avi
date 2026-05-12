import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const targetDays = [0, 1, 3, 7];
  const messages: any[] = [];

  for (const days of targetDays) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + days);
    targetDate.setHours(0, 0, 0, 0);

    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const { data: activities } = await supabase
      .from("activities")
      .select("id, title, type, subject_name, user_id, status")
      .eq("status", "pending")
      .gte("due_at", targetDate.toISOString())
      .lte("due_at", targetDateEnd.toISOString());

    if (!activities?.length) continue;

    for (const activity of activities) {
      const { data: tokenRow } = await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", activity.user_id)
        .single();

      if (!tokenRow?.token) continue;

      const label =
        activity.type === "evaluation" ? "evaluación" :
        activity.type === "final_project" ? "trabajo final" :
        activity.type === "protocol" ? "protocolo" : "actividad";

      const subject = activity.subject_name
        ? ` · ${activity.subject_name}`
        : "";

      let title = "";
      let body = "";

      if (days === 0) {
        title = `AVI · Hoy vence tu ${label}`;
        body = `${activity.title}${subject}. Puedes revisarlo cuando tengas un momento.`;
      } else if (days === 1) {
        title = `AVI · Mañana vence tu ${label} ✨`;
        body = `${activity.title}${subject}. Buen momento para dejarlo listo hoy.`;
      } else if (days === 3) {
        title = `AVI · Se acerca tu ${label} ✨`;
        body = `${activity.title}${subject} vence en 3 días. Te aviso con tiempo.`;
      } else if (days === 7) {
        title = `AVI · Tu ${label} vence en una semana ✨`;
        body = `${activity.title}${subject}. Todavía tienes margen. Buen momento para empezar.`;
      }

      messages.push({
        to: tokenRow.token,
        title,
        body,
        sound: "default",
        data: {
          activityId: activity.id,
          source: "avi",
        },
      });
    }
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const BATCH_SIZE = 100;
  let totalSent = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (response.ok) {
      totalSent += batch.length;
    }
  }

  return new Response(JSON.stringify({ sent: totalSent }), {
    headers: { "Content-Type": "application/json" },
  });
});
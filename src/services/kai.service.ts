import { supabase } from "@/src/lib/supabase";

export async function getTodayActivities(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("due_at", start.toISOString())
    .lte("due_at", end.toISOString())
    .order("due_at");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTomorrowActivities(userId: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("due_at", start.toISOString())
    .lte("due_at", end.toISOString())
    .order("due_at");

  if (error) throw error;

  return data ?? [];
}

export async function getPendingActivities(userId: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "completed")
    .order("due_at");

  if (error) throw error;

  return data ?? [];
}

export async function getExpiredActivities(userId: string) {
  const now = new Date();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "completed")
    .lt("due_at", now.toISOString())
    .order("due_at");

  if (error) throw error;

  return data ?? [];
}

export async function getNextActivity(userId: string) {
  const now = new Date();

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("due_at", now.toISOString())
    .order("due_at")
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getWeekActivities(userId: string) {
  const today = new Date();

  const end = new Date();
  end.setDate(end.getDate() + 7);

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .gte("due_at", today.toISOString())
    .lte("due_at", end.toISOString())
    .order("due_at");

  if (error) throw error;

  return data ?? [];
}


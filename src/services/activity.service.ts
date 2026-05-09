import { supabase } from "@/src/lib/supabase";

type Activity = {
  id: string;
  user_id: string;
  external_uid: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  source_url: string | null;
  type: string | null;
  unit_number: number | null;
  priority: string | null;
  subject_name: string | null;
  subject_code: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
};

let activitiesCache: Activity[] | null = null;
let activitiesCacheUserId: string | null = null;
let activitiesCacheTimestamp = 0;

const CACHE_TTL_MS = 1000 * 60 * 2;

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

function isCacheValid(userId: string) {
  if (!activitiesCache) return false;
  if (activitiesCacheUserId !== userId) return false;

  return Date.now() - activitiesCacheTimestamp < CACHE_TTL_MS;
}

function setActivitiesCache(userId: string, activities: Activity[]) {
  activitiesCache = activities;
  activitiesCacheUserId = userId;
  activitiesCacheTimestamp = Date.now();
}

export function clearActivitiesCache() {
  activitiesCache = null;
  activitiesCacheUserId = null;
  activitiesCacheTimestamp = 0;
}

export async function saveImportedActivities(activities: any[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // No incluimos status ni completed_at para no pisar actividades ya completadas
  const payload = activities.map((activity) => ({
    user_id: user.id,
    external_uid: activity.external_uid,
    title: activity.title,
    description: activity.description,
    due_at: activity.due_at,
    source_url: activity.source_url,
    type: activity.type,
    unit_number: activity.unit_number,
    priority: activity.priority,
    subject_name: activity.subject_name,
    subject_code: activity.subject_code,
  }));

  const { data, error } = await supabase
    .from("activities")
    .upsert(payload, {
      onConflict: "user_id,external_uid",
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    throw error;
  }

  clearActivitiesCache();

  return data;
}

export async function hasImportedActivities() {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  if (isCacheValid(user.id)) {
    return activitiesCache!.length > 0;
  }

  const { count, error } = await supabase
    .from("activities")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return Number(count) > 0;
}

export async function getActivities(options?: { forceRefresh?: boolean }) {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  if (!options?.forceRefresh && isCacheValid(user.id)) {
    return activitiesCache!;
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .order("due_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const activities = (data ?? []) as Activity[];

  setActivitiesCache(user.id, activities);

  return activities;
}

export async function completeActivity(id: string) {
  const { data, error } = await supabase
    .from("activities")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  clearActivitiesCache();

  return data;
}